import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortType, PortState, Position } from '../types';

@Component({
  selector: 'ui-port',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g 
      class="ui-port"
      [class]="portClasses"
      [attr.transform]="transform"
    >
      <svg:circle
        class="port-circle"
        [attr.cx]="0"
        [attr.cy]="0"
        [attr.r]="radius"
        [attr.fill]="fillColor"
        [attr.stroke]="strokeColor"
        [attr.stroke-width]="strokeWidth"
        (mousedown)="onMouseDown.emit({ event: $event, portId: portId, portType: type })"
        (mouseup)="onMouseUp.emit({ event: $event, portId: portId, portType: type })"
        (mouseenter)="onMouseEnter.emit({ event: $event, portId: portId, portType: type })"
        (mouseleave)="onMouseLeave.emit({ event: $event, portId: portId, portType: type })"
      />
      
      @if (showLabel && label) {
        <svg:text
          class="port-label"
          [attr.x]="labelX"
          [attr.y]="labelY"
          [attr.text-anchor]="labelAnchor"
          [attr.fill]="labelColor"
        >
          {{ label }}
          @if (showConnectionWarning) {
            <svg:tspan class="connection-warning"> (no connections)</svg:tspan>
          }
        </svg:text>
      }
    </svg:g>
  `,
  styleUrl: './port.component.css'
})
export class UIPortComponent {
  @Input({ required: true }) portId!: string;
  @Input({ required: true }) type!: PortType;
  @Input() state: PortState = 'default';
  @Input() position: Position = { x: 0, y: 0 };
  @Input() label?: string;
  @Input() showLabel: boolean = true;
  @Input() showConnectionWarning: boolean = false;
  @Input() radius: number = 4;
  @Input() connected: boolean = false;

  @Output() onMouseDown = new EventEmitter<{ event: MouseEvent; portId: string; portType: PortType }>();
  @Output() onMouseUp = new EventEmitter<{ event: MouseEvent; portId: string; portType: PortType }>();
  @Output() onMouseEnter = new EventEmitter<{ event: MouseEvent; portId: string; portType: PortType }>();
  @Output() onMouseLeave = new EventEmitter<{ event: MouseEvent; portId: string; portType: PortType }>();

  get transform(): string {
    return `translate(${this.position.x}, ${this.position.y})`;
  }

  get portClasses(): string {
    const classes = [
      `ui-port--${this.type}`,
      `ui-port--${this.state}`
    ];

    if (this.connected) {
      classes.push('ui-port--connected');
    }

    return classes.join(' ');
  }

  get fillColor(): string {
    switch (this.state) {
      case 'connected':
        return '#007acc';
      case 'highlighted':
        return '#FF9800';
      case 'dragging':
        return '#4CAF50';
      default:
        return this.connected ? '#007acc' : '#cccccc';
    }
  }

  get strokeColor(): string {
    return '#333333';
  }

  get strokeWidth(): number {
    return this.state === 'highlighted' || this.state === 'dragging' ? 2 : 1;
  }

  get labelX(): number {
    return this.type === 'input' ? 8 : -8;
  }

  get labelY(): number {
    return 3;
  }

  get labelAnchor(): string {
    return this.type === 'input' ? 'start' : 'end';
  }

  get labelColor(): string {
    return '#333333';
  }
}