import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseNodeComponent } from '../base/base-node.component';
import { NodeWrapperComponent } from '../wrapper/node-wrapper.component';
import { Node } from '../../../../core';
import { NodeTypeLibrary } from '../../../node-palette/node-library.service';
import { SvgInputComponent, SvgButtonComponent } from '../../../../shared/svg-ui';

@Component({
  selector: 'app-function-node',
  standalone: true,
  imports: [CommonModule, FormsModule, NodeWrapperComponent, SvgInputComponent, SvgButtonComponent],
  templateUrl: './function-node.component.html',
  styleUrl: './function-node.component.css'
})
export class FunctionNodeComponent extends BaseNodeComponent {
  @Input() editingFunctionName = signal<string | null>(null);
  @Input() editingArguments = signal<string | null>(null);
  @Input() isEditMode: boolean = true;

  @Output() functionNameEdit = new EventEmitter<string>();
  @Output() argumentsEdit = new EventEmitter<string>();
  @Output() functionNameChange = new EventEmitter<{ nodeId: string; name: string }>();
  @Output() codeChange = new EventEmitter<{ nodeId: string; code: string }>();
  @Output() argumentChange = new EventEmitter<{ nodeId: string; index: number; name: string }>();

  getWidth(): number {
    const dragAreaWidth = 120;
    const nameAreaWidth = this.getFunctionNameWidth();
    const buttonsWidth = 50;
    const padding = 16; // 8px on each side
    
    const headerContentWidth = dragAreaWidth + nameAreaWidth + buttonsWidth + padding;
    const portsWidth = this.safeMax(this.getPortsLength(this.node.inputs), this.getPortsLength(this.node.outputs)) * 80 + 40;
    
    return Math.max(240, headerContentWidth, portsWidth); // 240px minimum (120+120)
  }

  getHeight(): number {
    const baseHeight = 30 + this.safeMax(this.getPortsLength(this.node.inputs), this.getPortsLength(this.node.outputs)) * 20 + 10;
    const headerHeight = this.getFunctionHeaderHeight();
    const codeAreaHeight = this.isEditing ? 130 : 70;
    const gap = 10; // Gap between header and code area
    
    return baseHeight + headerHeight + codeAreaHeight + gap;
  }

  getColor(): string {
    return this.getNodeColor();
  }

  getFunctionHeaderHeight(): number {
    let headerHeight = 40; // Base function header height for inline layout
    
    if (this.editingArguments() === this.node.id) {
      headerHeight += 100; // Add arguments editor height
    }
    
    return headerHeight;
  }

  getFunctionBodyY(): number {
    const portsY = 35 + this.safeMax(this.getPortsLength(this.node.inputs), this.getPortsLength(this.node.outputs)) * 20;
    const headerHeight = this.getFunctionHeaderHeight();
    
    return Math.max(portsY, headerHeight);
  }

  getFunctionBodyHeight(): number {
    return this.isEditing ? 130 : 70;
  }

  getCodeEditorHeight(): number {
    return this.isEditing ? 120 : 60;
  }

  getFunctionNameWidth(): number {
    const functionName = this.node.functionName || 'Unnamed Function';
    const estimatedTextWidth = functionName.length * 7 + 8; // +8 for padding
    const minWidth = 120;
    const maxWidth = 300; // Reasonable maximum
    
    return Math.max(minWidth, Math.min(maxWidth, estimatedTextWidth));
  }

  // Event handlers
  onHeaderMouseDown(event: MouseEvent): void {
    this.onNodeHeaderMouseDown(event);
  }

  onNodeRightClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Emit to parent canvas
  }

  toggleFunctionNameEdit(): void {
    this.functionNameEdit.emit(this.node.id);
  }

  toggleArgumentsEdit(): void {
    this.argumentsEdit.emit(this.node.id);
  }

  onFunctionNameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.functionNameChange.emit({ nodeId: this.node.id, name: target.value });
  }

  updateFunctionName(name: string): void {
    this.functionNameChange.emit({ nodeId: this.node.id, name });
  }

  finishFunctionNameEdit(): void {
    this.editingFunctionName.set(null);
  }

  cancelFunctionNameEdit(): void {
    this.editingFunctionName.set(null);
  }

  onFunctionNameBlur(event: FocusEvent): void {
    // Handle blur logic
  }

  onFunctionNameKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Finish editing
      event.preventDefault();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      // Focus code editor
    }
  }

  onNodeBodyClick(event: MouseEvent): void {
    if (this.isEditMode) {
      this.onNodeEdit();
    }
  }

  onBodyAreaMouseDown(event: MouseEvent): void {
    // Handle body area mouse down
  }

  onCodeChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.codeChange.emit({ nodeId: this.node.id, code: target.value });
  }

  onEditorBlur(event: FocusEvent): void {
    // Handle editor blur
  }

  onCodeEditorKeyDown(event: KeyboardEvent): void {
    // Handle code editor key events
  }

  onTextAreaClick(event: MouseEvent): void {
    // Handle textarea click
  }

  onArgumentNameChange(event: Event, index: number): void {
    const target = event.target as HTMLInputElement;
    this.argumentChange.emit({ nodeId: this.node.id, index, name: target.value });
  }

  addArgument(): void {
    // Add new argument logic
  }

  removeArgument(index: number): void {
    // Remove argument logic
  }

  closeArgumentsEdit(): void {
    // Close arguments editor
  }
}