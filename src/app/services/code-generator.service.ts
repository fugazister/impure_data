import { Injectable } from '@angular/core';
import { Node, Connection } from '../models/node.model';
import { NodeTypeLibrary } from './node-library.service';

export interface CodeGenerationResult {
  success: boolean;
  code: string;
  errors: string[];
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CodeGeneratorService {
  
  generateCode(nodes: Node[], connections: Connection[]): CodeGenerationResult {
    const result: CodeGenerationResult = {
      success: true,
      code: '',
      errors: [],
      warnings: []
    };

    try {
      // Build dependency graph
      const dependencyGraph = this.buildDependencyGraph(nodes, connections);
      
      // Check for cycles
      const cycles = this.detectCycles(dependencyGraph);
      if (cycles.length > 0) {
        result.errors.push(`Circular dependencies detected: ${cycles.join(', ')}`);
        result.success = false;
        return result;
      }

      // Topological sort to determine execution order
      const executionOrder = this.topologicalSort(dependencyGraph);
      
      // Generate code for each node in order
      const codeBlocks: string[] = [];
      const nodeValues = new Map<string, string>();
      
      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        const nodeType = NodeTypeLibrary.getNodeType(node.type);
        if (!nodeType) {
          result.errors.push(`Unknown node type: ${node.type}`);
          continue;
        }

        // Get input values for this node
        const inputValues = this.getNodeInputValues(node, connections, nodeValues);
        
        // Generate code for this node
        const nodeCode = nodeType.generator(inputValues, node.config);
        
        // Store the result for nodes that have outputs
        if (node.outputs.length > 0) {
          const variableName = this.getNodeVariableName(node);
          nodeValues.set(node.id, variableName);
          
          // Only create variable assignment for nodes with outputs
          if (nodeType.category !== 'io' || node.type === 'io.return') {
            codeBlocks.push(`const ${variableName} = ${nodeCode};`);
          } else {
            // For I/O nodes like console.log, just add the statement
            codeBlocks.push(`${nodeCode};`);
          }
        } else {
          // For nodes without outputs (like console.log), just add the statement
          codeBlocks.push(`${nodeCode};`);
        }
      }

      // Wrap in a function if there are any nodes
      if (codeBlocks.length > 0) {
        result.code = this.wrapInFunction(codeBlocks);
      } else {
        result.code = '// No nodes to generate code for';
        result.warnings.push('No nodes found to generate code');
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Code generation failed: ${error}`);
    }

    return result;
  }

  private buildDependencyGraph(nodes: Node[], connections: Connection[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize graph with all nodes
    nodes.forEach(node => {
      graph.set(node.id, []);
    });

    // Add dependencies based on connections
    connections.forEach(connection => {
      const dependencies = graph.get(connection.toNodeId) || [];
      dependencies.push(connection.fromNodeId);
      graph.set(connection.toNodeId, dependencies);
    });

    return graph;
  }

  private detectCycles(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        const cycleStart = path.indexOf(nodeId);
        cycles.push(path.slice(cycleStart).join(' -> ') + ' -> ' + nodeId);
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const dependencies = graph.get(nodeId) || [];
      for (const dep of dependencies) {
        if (dfs(dep, [...path, nodeId])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      
      visited.add(nodeId);
      
      const dependencies = graph.get(nodeId) || [];
      dependencies.forEach(dep => dfs(dep));
      
      result.push(nodeId);
    };

    for (const nodeId of graph.keys()) {
      dfs(nodeId);
    }

    return result;
  }

  private getNodeInputValues(node: Node, connections: Connection[], nodeValues: Map<string, string>): any[] {
    const inputValues: any[] = [];

    node.inputs.forEach((input, index) => {
      // Find connection to this input port
      const connection = connections.find(conn => 
        conn.toNodeId === node.id && conn.toPortId === input.id
      );

      if (connection) {
        // Get value from connected node
        const connectedValue = nodeValues.get(connection.fromNodeId);
        inputValues[index] = connectedValue || input.value;
      } else {
        // Use default value
        inputValues[index] = input.value;
      }
    });

    return inputValues;
  }

  private getNodeVariableName(node: Node): string {
    const nodeType = NodeTypeLibrary.getNodeType(node.type);
    const baseName = nodeType?.name.toLowerCase().replace(/\s+/g, '_') || 'node';
    const nodeIdSuffix = node.id.substring(0, 4);
    return `${baseName}_${nodeIdSuffix}`;
  }

  private wrapInFunction(codeBlocks: string[]): string {
    const indentedCode = codeBlocks.map(line => `  ${line}`).join('\n');
    
    return `function generatedCode() {
${indentedCode}
}

// Execute the generated code
generatedCode();`;
  }

  // Utility method to validate the generated code
  validateGeneratedCode(code: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // Basic syntax validation using Function constructor
      new Function(code);
      return { isValid: true, errors: [] };
    } catch (error) {
      errors.push(`Syntax error: ${error}`);
      return { isValid: false, errors };
    }
  }

  // Method to execute generated code safely
  executeCode(code: string): { success: boolean; output: any[]; errors: string[] } {
    const result = {
      success: true,
      output: [] as any[],
      errors: [] as string[]
    };

    try {
      // Capture console.log output
      const originalLog = console.log;
      const capturedOutput: any[] = [];
      
      console.log = (...args: any[]) => {
        capturedOutput.push(args.length === 1 ? args[0] : args);
        originalLog(...args); // Still log to actual console
      };

      // Execute the code
      const func = new Function(code);
      const executionResult = func();
      
      // Restore original console.log
      console.log = originalLog;
      
      result.output = capturedOutput;
      
      // If the function returned something, add it to output
      if (executionResult !== undefined) {
        result.output.push(executionResult);
      }
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Execution error: ${error}`);
    }

    return result;
  }
}