import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseNodeComponent } from './base-node.component';
import { NodeWrapperComponent } from './node-wrapper.component';
import { NodeTypeLibrary } from '../../node-palette/node-library.service';

@Component({
  selector: 'app-simple-node',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  templateUrl: './simple-node.component.html',
  styleUrl: './simple-node.component.css'
})
export class SimpleNodeComponent extends BaseNodeComponent {
  
  getWidth(): number {
    return Math.max(120, this.safeMax(this.getPortsLength(this.node.inputs), this.getPortsLength(this.node.outputs)) * 80 + 40);
  }

  getHeight(): number {
    return 30 + this.safeMax(this.getPortsLength(this.node.inputs), this.getPortsLength(this.node.outputs)) * 20 + 10;
  }

  getColor(): string {
    const nodeType = NodeTypeLibrary.getNodeType(this.node.type);
    return nodeType?.color || '#666';
  }

  getDisplayName(): string {
    const nodeType = NodeTypeLibrary.getNodeType(this.node.type);
    return nodeType?.name || 'Unknown';
  }

  onHeaderMouseDown(event: MouseEvent): void {
    this.onNodeHeaderMouseDown(event);
  }

  onNodeRightClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // Emit to parent canvas
  }
}