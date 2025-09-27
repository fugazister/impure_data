import { Injectable, inject } from '@angular/core';
import { Node, Connection } from '../../core';
import { NodeTypeLibrary } from '../node-palette/node-library.service';
import { DebugService } from '../../core/debug.service';

export interface ExecutionContext {
  variables: Map<string, any>;
  output: any[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TriggerExecutorService {
  private debugService = inject(DebugService);
  
  // Execute document triggers (like PD's loadbang)
  executeDocumentTriggers(nodes: Node[], connections: Connection[]): ExecutionContext {
    this.debugService.log('TriggerExecutor', 'Starting document trigger execution');
    
    const context: ExecutionContext = {
      variables: new Map(),
      output: ['=== DOCUMENT TRIGGERS EXECUTED ==='],
      errors: []
    };

    // Find all document trigger nodes
    const documentTriggers = nodes.filter(node => node.type === 'trigger.document');
    this.debugService.log('TriggerExecutor', `Found ${documentTriggers.length} document triggers`);
    
    if (documentTriggers.length === 0) {
      context.output.push('No document triggers found');
      this.debugService.log('TriggerExecutor', 'No document triggers found');
      return context;
    }

    // Execute each document trigger and propagate through the graph
    documentTriggers.forEach((trigger, index) => {
      this.debugService.log('TriggerExecutor', `Executing document trigger ${index + 1}/${documentTriggers.length}: ${trigger.label || trigger.id}`);
      context.output.push(`--- Executing Document Trigger: ${trigger.label || 'Document'} ---`);
      this.executeTriggerChain(trigger, nodes, connections, context);
    });

    this.debugService.log('TriggerExecutor', 'Document trigger execution completed');
    return context;
  }

  // Execute function nodes directly (for backward compatibility)
  executeFunctionNodes(nodes: Node[]): ExecutionContext {
    this.debugService.log('TriggerExecutor', 'Starting function nodes execution');
    
    const context: ExecutionContext = {
      variables: new Map(),
      output: ['=== FUNCTION NODES EXECUTED ==='],
      errors: []
    };

    const functionNodes = nodes.filter(node => node.type === 'function' && node.customCode);
    this.debugService.log('TriggerExecutor', `Found ${functionNodes.length} function nodes with code`);
    
    if (functionNodes.length === 0) {
      context.output.push('No function nodes with code found');
      this.debugService.log('TriggerExecutor', 'No function nodes with code found');
      return context;
    }

    functionNodes.forEach((node, index) => {
      if (node.customCode && node.customCode.trim()) {
        this.debugService.log('TriggerExecutor', `Executing function ${index + 1}/${functionNodes.length}: ${node.functionName || node.label || node.id}`);
        
        try {
          const result = this.executeCode(node.customCode);
          context.output.push(`--- Node: ${node.label || 'Function'} ---`);
          context.output.push(...result.output);
          if (!result.success) {
            context.errors.push(...result.errors);
            this.debugService.error('TriggerExecutor', `Function execution failed: ${node.functionName || node.id}`, result.errors);
          } else {
            this.debugService.log('TriggerExecutor', `Function executed successfully: ${node.functionName || node.id}`);
          }
        } catch (error) {
          const errorMsg = `Error executing node ${node.label || 'Function'}: ${error}`;
          context.errors.push(errorMsg);
          this.debugService.error('TriggerExecutor', errorMsg, error);
        }
      }
    });

    this.debugService.log('TriggerExecutor', 'Function nodes execution completed');
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
    this.debugService.log('TriggerExecutor', `Executing node: ${node.type} (${node.label || node.id})`);
    
    try {
      const nodeType = NodeTypeLibrary.getNodeType(node.type);
      if (!nodeType) {
        context.errors.push(`Unknown node type: ${node.type}`);
        this.debugService.error('TriggerExecutor', `Unknown node type: ${node.type}`);
        return;
      }

      // Get input values for this node from connections
      const inputValues = this.getNodeInputValues(node, connections, context.variables);
      this.debugService.log('TriggerExecutor', `Input values for ${node.id}:`, inputValues);

      // Generate code using the node type generator (this handles function nodes properly)
      const code = nodeType.generator(inputValues, node);
      this.debugService.log('TriggerExecutor', `Generated code for ${node.id}: ${code}`);
      
      // Execute the generated code
      const result = this.executeCode(code);
      context.output.push(`Executing ${node.label || nodeType.name}:`);
      context.output.push(...result.output);
      
      if (!result.success) {
        context.errors.push(...result.errors);
        this.debugService.error('TriggerExecutor', `Node execution failed: ${node.id}`, result.errors);
      } else {
        this.debugService.log('TriggerExecutor', `Node executed successfully: ${node.id}`, result.output);
      }

      // Store result in context for connected nodes
      if (node.outputs.length > 0) {
        // For function nodes, prioritize the actual return value
        let resultValue = result.success; // Default fallback
        
        if (result.output.length > 0) {
          // Use the last output item (which is the function return value for function nodes)
          resultValue = result.output[result.output.length - 1];
        }
        
        context.variables.set(node.id, resultValue);
        this.debugService.log('TriggerExecutor', `Stored result for ${node.id}:`, resultValue);
      }

      // Continue execution chain for connected nodes
      const connectedNodes = this.getConnectedNodes(node, nodes, connections);
      this.debugService.log('TriggerExecutor', `Found ${connectedNodes.length} connected nodes from ${node.id}`);
      
      connectedNodes.forEach(connectedNode => {
        this.executeNode(connectedNode, nodes, connections, context);
      });
      
    } catch (error) {
      const errorMsg = `Error executing node ${node.label || node.id}: ${error}`;
      context.errors.push(errorMsg);
      this.debugService.error('TriggerExecutor', errorMsg, error);
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
        this.debugService.log('TriggerExecutor', `Function returned value:`, executionResult);
      } else {
        this.debugService.log('TriggerExecutor', `Function returned undefined`);
      }
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Execution error: ${error}`);
    }

    return result;
  }
}