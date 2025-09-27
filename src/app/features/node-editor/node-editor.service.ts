import { Injectable, signal, inject } from '@angular/core';
import { Node, Connection, Project, Position } from '../../core';
import { NodeTypeLibrary } from '../node-palette/node-library.service';
import { DebugService } from '../../core/debug.service';

@Injectable({
  providedIn: 'root'
})
export class NodeEditorService {
  private project = signal<Project>({
    id: 'default',
    name: 'Untitled Project',
    nodes: [],
    connections: [],
    metadata: {
      created: new Date(),
      modified: new Date(),
      version: '1.0.0'
    }
  });

  private selectedNodeId = signal<string | null>(null);
  private isDragging = signal<boolean>(false);
  private dragOffset = signal<Position>({ x: 0, y: 0 });
  private canvasOffset = signal<Position>({ x: 0, y: 0 });
  private zoom = signal<number>(1);
  
  // Mode management - true for edit mode, false for execution mode
  private editorMode = signal<'edit' | 'execution'>('edit');

  readonly nodes = signal<Node[]>([]);
  readonly connections = signal<Connection[]>([]);
  readonly selectedNode = signal<Node | null>(null);
  readonly currentMode = this.editorMode.asReadonly();

  private debugService = inject(DebugService);

  constructor() {
    NodeTypeLibrary.initialize();
  }

  // Node operations
  addNode(typeId: string, position: Position): Node {
    const nodeType = NodeTypeLibrary.getNodeType(typeId);
    if (!nodeType) {
      throw new Error(`Node type ${typeId} not found`);
    }

    const node: Node = {
      id: this.generateId(),
      type: typeId,
      position,
      inputs: nodeType.defaultInputs.map(input => ({
        ...input,
        id: this.generateId()
      })),
      outputs: nodeType.defaultOutputs.map(output => ({
        ...output,
        id: this.generateId()
      })),
      label: nodeType.name
    };

    const currentNodes = this.nodes();
    this.nodes.set([...currentNodes, node]);
    this.updateProject();
    
    // Debug log
    this.debugService.log('NodeEditor', `Added node: ${typeId} (${node.id}) at position (${position.x}, ${position.y})`, { 
      nodeType: typeId, 
      nodeId: node.id, 
      position,
      totalNodes: currentNodes.length + 1 
    });
    
    return node;
  }

  removeNode(nodeId: string): void {
    // Remove all connections involving this node
    const currentConnections = this.connections();
    const filteredConnections = currentConnections.filter(
      conn => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
    );
    this.connections.set(filteredConnections);

    // Remove the node
    const currentNodes = this.nodes();
    const filteredNodes = currentNodes.filter(node => node.id !== nodeId);
    this.nodes.set(filteredNodes);

    this.updateProject();
  }

  updateNodePosition(nodeId: string, position: Position): void {
    const currentNodes = this.nodes();
    const updatedNodes = currentNodes.map(node => 
      node.id === nodeId ? { ...node, position } : node
    );
    this.nodes.set(updatedNodes);
    this.updateProject();
  }

  updateNodeConfig(nodeId: string, config: any): void {
    const currentNodes = this.nodes();
    const updatedNodes = currentNodes.map(node => 
      node.id === nodeId ? { ...node, config } : node
    );
    this.nodes.set(updatedNodes);
    this.updateProject();
  }

  updateNode(nodeId: string, updates: Partial<Node>): void {
    const currentNodes = this.nodes();
    const updatedNodes = currentNodes.map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    this.nodes.set(updatedNodes);
    this.updateProject();
    
    // Debug log
    this.debugService.log('NodeEditor', `Updated node: ${nodeId}`, { 
      nodeId, 
      updates,
      timestamp: Date.now() 
    });
  }

  // Connection operations
  addConnection(fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string): Connection {
    // Check if connection already exists
    const existing = this.connections().find(conn => 
      conn.fromNodeId === fromNodeId && 
      conn.fromPortId === fromPortId && 
      conn.toNodeId === toNodeId && 
      conn.toPortId === toPortId
    );

    if (existing) {
      return existing;
    }

    const connection: Connection = {
      id: this.generateId(),
      fromNodeId,
      fromPortId,
      toNodeId,
      toPortId
    };

    const currentConnections = this.connections();
    this.connections.set([...currentConnections, connection]);
    this.updateProject();
    
    // Debug log
    this.debugService.log('NodeEditor', `Added connection: ${fromNodeId}.${fromPortId} -> ${toNodeId}.${toPortId}`, { 
      connectionId: connection.id,
      fromNodeId, 
      fromPortId, 
      toNodeId, 
      toPortId,
      totalConnections: currentConnections.length + 1 
    });
    
    return connection;
  }

  removeConnection(connectionId: string): void {
    const currentConnections = this.connections();
    const filteredConnections = currentConnections.filter(conn => conn.id !== connectionId);
    this.connections.set(filteredConnections);
    this.updateProject();
  }

  // Selection operations
  selectNode(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);
    const selectedNode = nodeId ? this.nodes().find(node => node.id === nodeId) || null : null;
    this.selectedNode.set(selectedNode);
  }

  // Canvas operations
  setCanvasOffset(offset: Position): void {
    this.canvasOffset.set(offset);
  }

  getCanvasOffset(): Position {
    return this.canvasOffset();
  }

  setZoom(zoom: number): void {
    this.zoom.set(Math.max(0.1, Math.min(3, zoom)));
  }

  getZoom(): number {
    return this.zoom();
  }

  // Project operations
  newProject(): void {
    this.project.set({
      id: this.generateId(),
      name: 'Untitled Project',
      nodes: [],
      connections: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0.0'
      }
    });
    this.nodes.set([]);
    this.connections.set([]);
    this.selectNode(null);
  }

  loadProject(project: Project): void {
    this.project.set(project);
    this.nodes.set(project.nodes);
    this.connections.set(project.connections);
    this.selectNode(null);
  }

  getProject(): Project {
    return this.project();
  }

  private updateProject(): void {
    const current = this.project();
    this.project.set({
      ...current,
      nodes: this.nodes(),
      connections: this.connections(),
      metadata: {
        ...current.metadata,
        modified: new Date()
      }
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Utility methods
  getNodeConnections(nodeId: string): Connection[] {
    return this.connections().filter(
      conn => conn.fromNodeId === nodeId || conn.toNodeId === nodeId
    );
  }

  getNodeInputConnections(nodeId: string): Connection[] {
    return this.connections().filter(conn => conn.toNodeId === nodeId);
  }

  getNodeOutputConnections(nodeId: string): Connection[] {
    return this.connections().filter(conn => conn.fromNodeId === nodeId);
  }

  isPortConnected(nodeId: string, portId: string, type: 'input' | 'output'): boolean {
    if (type === 'input') {
      return this.connections().some(conn => conn.toNodeId === nodeId && conn.toPortId === portId);
    } else {
      return this.connections().some(conn => conn.fromNodeId === nodeId && conn.fromPortId === portId);
    }
  }

  // Mode management methods
  setMode(mode: 'edit' | 'execution'): void {
    this.editorMode.set(mode);
  }

  isEditMode(): boolean {
    return this.editorMode() === 'edit';
  }

  isExecutionMode(): boolean {
    return this.editorMode() === 'execution';
  }

  toggleMode(): void {
    const currentMode = this.editorMode();
    this.setMode(currentMode === 'edit' ? 'execution' : 'edit');
  }
}