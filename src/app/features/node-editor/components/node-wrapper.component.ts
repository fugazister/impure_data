import { Component, Input, Output, EventEmitter, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../core';

/**
 * Common node wrapper component that provides the shared SVG structure
 * This handles ports, background, selection, etc. while allowing custom content
 */
@Component({
  selector: 'app-node-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './node-wrapper.component.html',
  styleUrl: './node-wrapper.component.css'
})
export class NodeWrapperComponent {
  @Input({ required: true }) node!: Node;
  @Input({ required: true }) width!: number;
  @Input({ required: true }) height!: number;
  @Input({ required: true }) backgroundColor!: string;
  @Input() isSelected: boolean = false;
  @Input() isEditing: boolean = false;
  @Input() isEditMode: boolean = true;

  @Output() nodeRightClick = new EventEmitter<MouseEvent>();
  @Output() portMouseDown = new EventEmitter<{ event: MouseEvent; portId: string; portType: 'input' | 'output' }>();
  @Output() portMouseUp = new EventEmitter<{ event: MouseEvent; portId: string; portType: 'input' | 'output' }>();

  getPortY(index: number): number {
    return 35 + index * 20;
  }

  onNodeRightClick(event: MouseEvent): void {
    this.nodeRightClick.emit(event);
  }

  onPortMouseDown(event: MouseEvent, portId: string, portType: 'input' | 'output'): void {
    this.portMouseDown.emit({ event, portId, portType });
  }

  onPortMouseUp(event: MouseEvent, portId: string, portType: 'input' | 'output'): void {
    this.portMouseUp.emit({ event, portId, portType });
  }

  isPortConnected(portId: string, portType: 'input' | 'output'): boolean {
    // This will be implemented by injecting the NodeEditorService
    return false; // Placeholder
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