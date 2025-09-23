import { Injectable } from '@angular/core';
import { Node, Connection } from '../../core';
import { NodeTypeLibrary } from '../node-palette/node-library.service';

export interface ExecutionContext {
  variables: Map<string, any>;
  output: any[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TriggerExecutorService {
  
  // Execute document triggers (like PD's loadbang)
  executeDocumentTriggers(nodes: Node[], connections: Connection[]): ExecutionContext {
    const context: ExecutionContext = {
      variables: new Map(),
      output: ['=== DOCUMENT TRIGGERS EXECUTED ==='],
      errors: []
    };

    // Find all document trigger nodes
    const documentTriggers = nodes.filter(node => node.type === 'trigger.document');
    
    if (documentTriggers.length === 0) {
      context.output.push('No document triggers found');
      return context;
    }

    // Execute each document trigger and propagate through the graph
    documentTriggers.forEach(trigger => {
      context.output.push(`--- Executing Document Trigger: ${trigger.label || 'Document'} ---`);
      this.executeTriggerChain(trigger, nodes, connections, context);
    });

    return context;
  }

  // Execute function nodes directly (for backward compatibility)
  executeFunctionNodes(nodes: Node[]): ExecutionContext {
    const context: ExecutionContext = {
      variables: new Map(),
      output: ['=== FUNCTION NODES EXECUTED ==='],
      errors: []
    };

    const functionNodes = nodes.filter(node => node.type === 'function' && node.customCode);
    
    if (functionNodes.length === 0) {
      context.output.push('No function nodes with code found');
      return context;
    }

    functionNodes.forEach(node => {
      if (node.customCode && node.customCode.trim()) {
        try {
          const result = this.executeCode(node.customCode);
          context.output.push(`--- Node: ${node.label || 'Function'} ---`);
          context.output.push(...result.output);
          if (!result.success) {
            context.errors.push(...result.errors);
          }
        } catch (error) {
          context.errors.push(`Error in ${node.label || 'Function'}: ${error}`);
        }
      }
    });

    return context;
  }

  private executeTriggerChain(startNode: Node, nodes: Node[], connections: Connection[], context: ExecutionContext): void {
    // Find all nodes connected to this trigger's outputs
    const connectedNodes = this.getConnectedNodes(startNode, nodes, connections);
    
    // Execute each connected node
    connectedNodes.forEach(targetNode => {
      this.executeNode(targetNode, nodes, connections, context);
    });
  }

  private getConnectedNodes(sourceNode: Node, nodes: Node[], connections: Connection[]): Node[] {
    const connectedNodeIds = new Set<string>();
    
    // Find all connections from this node's outputs
    sourceNode.outputs.forEach(output => {
      const outgoingConnections = connections.filter(conn => 
        conn.fromNodeId === sourceNode.id && conn.fromPortId === output.id
      );
      
      outgoingConnections.forEach(conn => {
        connectedNodeIds.add(conn.toNodeId);
      });
    });

    // Return the actual node objects
    return Array.from(connectedNodeIds)
      .map(nodeId => nodes.find(node => node.id === nodeId))
      .filter(node => node !== undefined) as Node[];
  }

  private executeNode(node: Node, nodes: Node[], connections: Connection[], context: ExecutionContext): void {
    try {
      const nodeType = NodeTypeLibrary.getNodeType(node.type);
      if (!nodeType) {
        context.errors.push(`Unknown node type: ${node.type}`);
        return;
      }

      // Handle different node types
      if (node.type === 'function' && node.customCode) {
        // Execute custom function code
        const result = this.executeCode(node.customCode);
        context.output.push(`Executing ${node.label || 'Function'}:`);
        context.output.push(...result.output);
        if (!result.success) {
          context.errors.push(...result.errors);
        }
      } else {
        // Execute standard node with inputs
        const inputValues = this.getNodeInputValues(node, connections, context.variables);
        const code = nodeType.generator(inputValues, node.config);
        
        // For DOM and trigger nodes, execute them directly
        if (nodeType.category === 'dom' || nodeType.category === 'trigger') {
          const result = this.executeCode(code);
          context.output.push(`${nodeType.name}: ${JSON.stringify(result.output)}`);
          
          // Store result in context for connected nodes
          if (node.outputs.length > 0) {
            const variableName = `node_${node.id.substring(0, 4)}`;
            context.variables.set(node.id, result.output[0] || result.success);
          }
        } else {
          // For other nodes, just store the generated code
          context.output.push(`Generated: ${code}`);
          if (node.outputs.length > 0) {
            const variableName = `node_${node.id.substring(0, 4)}`;
            context.variables.set(node.id, code);
          }
        }
      }

      // Continue execution chain for connected nodes
      const connectedNodes = this.getConnectedNodes(node, nodes, connections);
      connectedNodes.forEach(connectedNode => {
        this.executeNode(connectedNode, nodes, connections, context);
      });

    } catch (error) {
      context.errors.push(`Error executing ${node.label || node.type}: ${error}`);
    }
  }

  private getNodeInputValues(node: Node, connections: Connection[], variables: Map<string, any>): any[] {
    const inputValues: any[] = [];

    node.inputs.forEach((input, index) => {
      // Find connection to this input port
      const connection = connections.find(conn => 
        conn.toNodeId === node.id && conn.toPortId === input.id
      );

      if (connection) {
        // Get value from connected node
        const connectedValue = variables.get(connection.fromNodeId);
        inputValues[index] = connectedValue || input.value;
      } else {
        // Use default value
        inputValues[index] = input.value;
      }
    });

    return inputValues;
  }

  private executeCode(code: string): { success: boolean; output: any[]; errors: string[] } {
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