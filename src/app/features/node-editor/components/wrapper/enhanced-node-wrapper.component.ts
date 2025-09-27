import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../../core';
import { UIPortComponent } from '../../../../shared/ui';

/**
 * Enhanced node wrapper component using the UI Kit
 * This provides a cleaner, more maintainable approach to node rendering
 */
@Component({
  selector: 'app-enhanced-node-wrapper',
  standalone: true,
  imports: [CommonModule, UIPortComponent],
  templateUrl: './enhanced-node-wrapper.component.html',
  styleUrl: './enhanced-node-wrapper.component.css'
})
export class EnhancedNodeWrapperComponent {
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
  @Output() portMouseEnter = new EventEmitter<{ event: MouseEvent; portId: string; portType: 'input' | 'output' }>();
  @Output() portMouseLeave = new EventEmitter<{ event: MouseEvent; portId: string; portType: 'input' | 'output' }>();

  getPortY(index: number): number {
    return 35 + index * 20;
  }

  onNodeRightClick(event: MouseEvent): void {
    this.nodeRightClick.emit(event);
  }

  onPortMouseDown(data: { event: MouseEvent; portId: string; portType: 'input' | 'output' }): void {
    this.portMouseDown.emit(data);
  }

  onPortMouseUp(data: { event: MouseEvent; portId: string; portType: 'input' | 'output' }): void {
    this.portMouseUp.emit(data);
  }

  onPortMouseEnter(data: { event: MouseEvent; portId: string; portType: 'input' | 'output' }): void {
    this.portMouseEnter.emit(data);
  }

  onPortMouseLeave(data: { event: MouseEvent; portId: string; portType: 'input' | 'output' }): void {
    this.portMouseLeave.emit(data);
  }

  isPortConnected(portId: string, portType: 'input' | 'output'): boolean {
    // This would be implemented by injecting the NodeEditorService
    // For now, return false as placeholder
    return false;
  }

  getPortState(portId: string, portType: 'input' | 'output'): 'default' | 'connected' | 'highlighted' | 'dragging' {
    // Logic to determine port state based on editor state
    if (this.isPortConnected(portId, portType)) {
      return 'connected';
    }
    return 'default';
  }
}