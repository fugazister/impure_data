import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseNodeComponent } from './base-node.component';
import { NodeWrapperComponent } from './node-wrapper.component';
import { NodeTypeLibrary } from '../../node-palette/node-library.service';

@Component({
  selector: 'app-base-output-node',
  standalone: true,
  imports: [CommonModule],
  template: '', // This is an abstract component
  styleUrl: './base-output-node.component.css'
})
export abstract class BaseOutputNodeComponent extends BaseNodeComponent {
  
  getWidth(): number {
    // Wider to accommodate input value and output display
    const baseWidth = 160;
    const outputDisplayWidth = this.getOutputValue().length * 8;
    return Math.max(baseWidth, outputDisplayWidth + 40, this.getPortsLength(this.node.inputs) * 80 + 40);
  }

  getHeight(): number {
    // Height for header + input ports + output display
    const baseHeight = 60; // Header + output display area
    const portsHeight = this.getPortsLength(this.node.inputs) * 20;
    return baseHeight + portsHeight;
  }

  getColor(): string {
    const nodeType = NodeTypeLibrary.getNodeType(this.node.type);
    return nodeType?.color || '#795548';
  }

  getDisplayName(): string {
    const nodeType = NodeTypeLibrary.getNodeType(this.node.type);
    return nodeType?.name || 'Output Node';
  }

  getInputValue(): string {
    // Get the current input value - could be from connections or default
    if (this.node.inputs && this.node.inputs.length > 0) {
      const inputPort = this.node.inputs[0];
      if (inputPort.value !== undefined) {
        return String(inputPort.value);
      }
      // Show a helpful placeholder when no value is connected
      return inputPort.connected ? 'connected value' : 'no input';
    }
    return 'no input';
  }

  // Abstract method that each output node type must implement
  abstract getOutputValue(): string;

  // Abstract method for the specific output operation
  abstract executeOutput(): void;

  onHeaderMouseDown(event: MouseEvent): void {
    this.onNodeHeaderMouseDown(event);
  }

  onNodeRightClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Emit to parent canvas
  }

  onExecuteClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.executeOutput();
  }
}