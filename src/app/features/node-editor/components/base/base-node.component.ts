import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { Node } from '../../../../core';
import { NodeEditorService } from '../../node-editor.service';

/**
 * Base abstract class for all node components
 * Defines the interface that all node types must implement
 */
@Component({
  template: '', // Will be overridden by child components
  standalone: true
})
export abstract class BaseNodeComponent {
  @Input({ required: true }) node!: Node;
  @Input() isSelected: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() canvasTransform: string = '';

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