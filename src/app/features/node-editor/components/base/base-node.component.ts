import { Component, Input, Output, EventEmitter, inject, computed, signal } from '@angular/core';
import { Node } from '../../../../core';
import { NodeEditorService } from '../../node-editor.service';
import { NodeTypeLibrary } from '../../../node-palette/node-library.service';

/**
 * Base abstract class for all node components
 * Defines the interface that all node types must implement
 */
@Component({
  template: '', // Will be overridden by child components
  standalone: true
})
export abstract class BaseNodeComponent {
  private _node!: Node;
  
  @Input({ required: true }) 
  get node(): Node { return this._node; }
  set node(value: Node) {
    this._node = value;
    this.nodeSignal.set(value);
  }
  
  @Input() isSelected: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() canvasTransform: string = '';

  // Cached node type to avoid redundant lookups
  protected nodeSignal = signal<Node | null>(null);
  protected nodeType = computed(() => {
    const currentNode = this.nodeSignal();
    return currentNode ? NodeTypeLibrary.getNodeType(currentNode.type) : null;
  });

  // Computed signals for template optimization
  public nodeWidth = computed(() => this.getWidth());
  public nodeHeight = computed(() => this.getHeight());
  public nodeColor = computed(() => this.getColor());

  // Events that nodes can emit
  @Output() nodeSelect = new EventEmitter<string>();
  @Output() nodeEdit = new EventEmitter<string>();
  @Output() nodeUpdate = new EventEmitter<{ nodeId: string; updates: Partial<Node> }>();
  @Output() nodeDelete = new EventEmitter<string>();
  @Output() headerMouseDown = new EventEmitter<{ event: MouseEvent; nodeId: string }>();
  @Output() portMouseDown = new EventEmitter<{ event: MouseEvent; nodeId: string; portId: string; portType: 'input' | 'output' }>();
  @Output() portMouseUp = new EventEmitter<{ event: MouseEvent; nodeId: string; portId: string; portType: 'input' | 'output' }>();

  protected nodeEditor = inject(NodeEditorService);

  // Abstract methods that child components must implement
  abstract getWidth(): number;
  abstract getHeight(): number;
  abstract getColor(): string;

  // Common utility methods
  protected safeMax(a: number = 0, b: number = 0): number {
    return Math.max(a, b);
  }

  protected getPortsLength(ports: any[] | undefined): number {
    return ports ? ports.length : 0;
  }

  // Cached common methods to avoid redundant NodeTypeLibrary lookups
  getDisplayName(): string {
    const type = this.nodeType();
    return type?.name || 'Unknown';
  }

  getNodeColor(): string {
    const type = this.nodeType();
    return type?.color || '#666';
  }

  // Common event handlers
  onNodeHeaderMouseDown(event: MouseEvent): void {
    this.headerMouseDown.emit({ event, nodeId: this.node.id });
  }

  onPortMouseDown(event: MouseEvent, portId: string, portType: 'input' | 'output'): void {
    this.portMouseDown.emit({ event, nodeId: this.node.id, portId, portType });
  }

  onPortMouseUp(event: MouseEvent, portId: string, portType: 'input' | 'output'): void {
    this.portMouseUp.emit({ event, nodeId: this.node.id, portId, portType });
  }

  onNodeSelect(): void {
    this.nodeSelect.emit(this.node.id);
  }

  onNodeEdit(): void {
    this.nodeEdit.emit(this.node.id);
  }

  onNodeUpdate(updates: Partial<Node>): void {
    this.nodeUpdate.emit({ nodeId: this.node.id, updates });
  }

  onNodeDelete(): void {
    this.nodeDelete.emit(this.node.id);
  }

  // Port connection utilities
  isPortConnected(portId: string, portType: 'input' | 'output'): boolean {
    return this.nodeEditor.isPortConnected(this.node.id, portId, portType);
  }

  getInputPortFill(input: any): string {
    return this.isPortConnected(input.id, 'input') ? '#007acc' : '#ccc';
  }

  getInputPortStroke(): string {
    return '#333';
  }

  getInputPortTextColor(): string {
    return '#333';
  }
}