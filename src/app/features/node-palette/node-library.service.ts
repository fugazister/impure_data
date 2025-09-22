import { NodeType } from '../../core';

export class NodeTypeLibrary {
  private static nodeTypes: Map<string, NodeType> = new Map();

  static registerNodeType(nodeType: NodeType): void {
    this.nodeTypes.set(nodeType.id, nodeType);
  }

  static getNodeType(id: string): NodeType | undefined {
    return this.nodeTypes.get(id);
  }

  static getAllNodeTypes(): NodeType[] {
    return Array.from(this.nodeTypes.values());
  }

  static getNodeTypesByCategory(category: NodeType['category']): NodeType[] {
    return Array.from(this.nodeTypes.values()).filter(
      (nodeType) => nodeType.category === category
    );
  }

  static initialize(): void {
    this.registerBasicMathNodes();
    this.registerLogicNodes();
    this.registerDataNodes();
    this.registerControlNodes();
    this.registerFunctionNodes();
    this.registerIONodes();
  }

  private static registerBasicMathNodes(): void {
    // Addition
    this.registerNodeType({
      id: 'math.add',
      category: 'math',
      name: 'Add',
      description: 'Adds two numbers',
      defaultInputs: [
        { type: 'input', dataType: 'number', label: 'a', value: 0 },
        { type: 'input', dataType: 'number', label: 'b', value: 0 }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'number', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || 0} + ${inputs[1] || 0})`,
      color: '#4CAF50'
    });

    // Subtraction
    this.registerNodeType({
      id: 'math.subtract',
      category: 'math',
      name: 'Subtract',
      description: 'Subtracts second number from first',
      defaultInputs: [
        { type: 'input', dataType: 'number', label: 'a', value: 0 },
        { type: 'input', dataType: 'number', label: 'b', value: 0 }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'number', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || 0} - ${inputs[1] || 0})`,
      color: '#4CAF50'
    });

    // Multiplication
    this.registerNodeType({
      id: 'math.multiply',
      category: 'math',
      name: 'Multiply',
      description: 'Multiplies two numbers',
      defaultInputs: [
        { type: 'input', dataType: 'number', label: 'a', value: 1 },
        { type: 'input', dataType: 'number', label: 'b', value: 1 }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'number', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || 1} * ${inputs[1] || 1})`,
      color: '#4CAF50'
    });

    // Division
    this.registerNodeType({
      id: 'math.divide',
      category: 'math',
      name: 'Divide',
      description: 'Divides first number by second',
      defaultInputs: [
        { type: 'input', dataType: 'number', label: 'a', value: 1 },
        { type: 'input', dataType: 'number', label: 'b', value: 1 }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'number', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || 1} / ${inputs[1] || 1})`,
      color: '#4CAF50'
    });
  }

  private static registerLogicNodes(): void {
    // AND
    this.registerNodeType({
      id: 'logic.and',
      category: 'logic',
      name: 'AND',
      description: 'Logical AND operation',
      defaultInputs: [
        { type: 'input', dataType: 'boolean', label: 'a', value: false },
        { type: 'input', dataType: 'boolean', label: 'b', value: false }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'boolean', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || false} && ${inputs[1] || false})`,
      color: '#FF9800'
    });

    // OR
    this.registerNodeType({
      id: 'logic.or',
      category: 'logic',
      name: 'OR',
      description: 'Logical OR operation',
      defaultInputs: [
        { type: 'input', dataType: 'boolean', label: 'a', value: false },
        { type: 'input', dataType: 'boolean', label: 'b', value: false }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'boolean', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || false} || ${inputs[1] || false})`,
      color: '#FF9800'
    });

    // NOT
    this.registerNodeType({
      id: 'logic.not',
      category: 'logic',
      name: 'NOT',
      description: 'Logical NOT operation',
      defaultInputs: [
        { type: 'input', dataType: 'boolean', label: 'input', value: false }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'boolean', label: 'result' }
      ],
      generator: (inputs) => `!(${inputs[0] || false})`,
      color: '#FF9800'
    });

    // Equals
    this.registerNodeType({
      id: 'logic.equals',
      category: 'logic',
      name: 'Equals',
      description: 'Checks if two values are equal',
      defaultInputs: [
        { type: 'input', dataType: 'any', label: 'a' },
        { type: 'input', dataType: 'any', label: 'b' }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'boolean', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || 'null'} === ${inputs[1] || 'null'})`,
      color: '#FF9800'
    });
  }

  private static registerDataNodes(): void {
    // Number
    this.registerNodeType({
      id: 'data.number',
      category: 'data',
      name: 'Number',
      description: 'A numeric constant',
      defaultInputs: [],
      defaultOutputs: [
        { type: 'output', dataType: 'number', label: 'value' }
      ],
      generator: (inputs, config) => `${config?.value || 0}`,
      color: '#2196F3'
    });

    // String
    this.registerNodeType({
      id: 'data.string',
      category: 'data',
      name: 'String',
      description: 'A string constant',
      defaultInputs: [],
      defaultOutputs: [
        { type: 'output', dataType: 'string', label: 'value' }
      ],
      generator: (inputs, config) => `"${config?.value || ''}"`,
      color: '#2196F3'
    });

    // Boolean
    this.registerNodeType({
      id: 'data.boolean',
      category: 'data',
      name: 'Boolean',
      description: 'A boolean constant',
      defaultInputs: [],
      defaultOutputs: [
        { type: 'output', dataType: 'boolean', label: 'value' }
      ],
      generator: (inputs, config) => `${config?.value || false}`,
      color: '#2196F3'
    });

    // Variable
    this.registerNodeType({
      id: 'data.variable',
      category: 'data',
      name: 'Variable',
      description: 'Read from a variable',
      defaultInputs: [],
      defaultOutputs: [
        { type: 'output', dataType: 'any', label: 'value' }
      ],
      generator: (inputs, config) => `${config?.name || 'variable'}`,
      color: '#2196F3'
    });
  }

  private static registerControlNodes(): void {
    // If statement
    this.registerNodeType({
      id: 'control.if',
      category: 'control',
      name: 'If',
      description: 'Conditional execution',
      defaultInputs: [
        { type: 'input', dataType: 'boolean', label: 'condition' },
        { type: 'input', dataType: 'any', label: 'then' },
        { type: 'input', dataType: 'any', label: 'else' }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'any', label: 'result' }
      ],
      generator: (inputs) => `(${inputs[0] || false} ? ${inputs[1] || 'null'} : ${inputs[2] || 'null'})`,
      color: '#9C27B0'
    });
  }

  private static registerFunctionNodes(): void {
    // Function call
    this.registerNodeType({
      id: 'function.call',
      category: 'function',
      name: 'Function Call',
      description: 'Call a function with arguments',
      defaultInputs: [
        { type: 'input', dataType: 'function', label: 'function' },
        { type: 'input', dataType: 'any', label: 'arg1' }
      ],
      defaultOutputs: [
        { type: 'output', dataType: 'any', label: 'result' }
      ],
      generator: (inputs) => `${inputs[0] || 'function'}(${inputs.slice(1).join(', ')})`,
      color: '#607D8B'
    });
  }

  private static registerIONodes(): void {
    // Console log
    this.registerNodeType({
      id: 'io.console',
      category: 'io',
      name: 'Console Log',
      description: 'Output to console',
      defaultInputs: [
        { type: 'input', dataType: 'any', label: 'value' }
      ],
      defaultOutputs: [],
      generator: (inputs) => `console.log(${inputs[0] || 'undefined'})`,
      color: '#795548'
    });

    // Return
    this.registerNodeType({
      id: 'io.return',
      category: 'io',
      name: 'Return',
      description: 'Return a value',
      defaultInputs: [
        { type: 'input', dataType: 'any', label: 'value' }
      ],
      defaultOutputs: [],
      generator: (inputs) => `return ${inputs[0] || 'undefined'}`,
      color: '#795548'
    });
  }
}