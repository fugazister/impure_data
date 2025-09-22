export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Port {
  id: string;
  type: 'input' | 'output';
  dataType: 'number' | 'string' | 'boolean' | 'object' | 'function' | 'any';
  label: string;
  value?: any;
  connected?: boolean;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  fromPortId: string;
  toNodeId: string;
  toPortId: string;
}

export interface NodeType {
  id: string;
  category: 'math' | 'logic' | 'control' | 'data' | 'function' | 'io';
  name: string;
  description: string;
  defaultInputs: Omit<Port, 'id'>[];
  defaultOutputs: Omit<Port, 'id'>[];
  generator: (inputs: any[], config?: any) => string;
  color?: string;
}

export interface Node {
  id: string;
  type: string;
  position: Position;
  size?: Size;
  inputs: Port[];
  outputs: Port[];
  label?: string;
  config?: any; // Node-specific configuration
  collapsed?: boolean;
  customCode?: string; // For user-defined function nodes
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  connections: Connection[];
  metadata: {
    created: Date;
    modified: Date;
    version: string;
  };
}