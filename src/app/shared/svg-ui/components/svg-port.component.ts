import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SVGPortType, SVGPortState, SVGPosition } from '../types';
import { svgTheme } from '../theme';

@Component({
  selector: '[svg-port]', // Attribute selector for SVG use
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g 
      class="svg-port"
      [class]="portClasses"
      [attr.transform]="transform"
    >
      <!-- Port circle -->
      <svg:circle
        class="svg-port-circle"
        cx="0"
        cy="0"
        [attr.r]="radius"
        [attr.fill]="fillColor"
        [attr.stroke]="strokeColor"
        [attr.stroke-width]="strokeWidth"
        (mousedown)="onMouseDown.emit({ event: $event, portId: portId, portType: type })"
        (mouseup)="onMouseUp.emit({ event: $event, portId: portId, portType: type })"
        (mouseenter)="onMouseEnter.emit({ event: $event, portId: portId, portType: type })"
        (mouseleave)="onMouseLeave.emit({ event: $event, portId: portId, portType: type })"
      />
      
      <!-- Port label -->
      @if (showLabel && label) {
        <svg:text
          class="svg-port-label"
          [attr.x]="labelX"
          [attr.y]="labelY"
          [attr.text-anchor]="labelAnchor"
          [attr.font-size]="10"
          [attr.fill]="labelColor"
        >
          {{ label }}
          @if (showConnectionWarning && !connected) {
            <svg:tspan class="connection-warning" fill="#FF9800" font-size="9"> (no connections)</svg:tspan>
          }
        </svg:text>
      }
    </svg:g>
  `,
  styleUrl: './svg-port.component.css'
})
export class SvgPortComponent {
  @Input({ required: true }) portId!: string;
  @Input({ required: true }) type!: SVGPortType;
  @Input() state: SVGPortState = 'default';
  @Input() position: SVGPosition = { x: 0, y: 0 };
  @Input() label?: string;
  @Input() showLabel: boolean = true;
  @Input() showConnectionWarning: boolean = false;
  @Input() connected: boolean = false;

  @Output() onMouseDown = new EventEmitter<{ event: MouseEvent; portId: string; portType: SVGPortType }>();
  @Output() onMouseUp = new EventEmitter<{ event: MouseEvent; portId: string; portType: SVGPortType }>();
  @Output() onMouseEnter = new EventEmitter<{ event: MouseEvent; portId: string; portType: SVGPortType }>();
  @Output() onMouseLeave = new EventEmitter<{ event: MouseEvent; portId: string; portType: SVGPortType }>();

  get transform(): string {
    return `translate(${this.position.x}, ${this.position.y})`;
  }

  get portClasses(): string {
    const classes = [
      `svg-port--${this.type}`,
      `svg-port--${this.state}`
    ];

    if (this.connected) {
      classes.push('svg-port--connected');
    }

    return classes.join(' ');
  }

  get radius(): number {
    return svgTheme.sizes.port.radius;
  }

  get fillColor(): string {
    switch (this.state) {
      case 'connected':
        return svgTheme.colors.port.connected;
      case 'highlighted':
        return svgTheme.colors.port.highlighted;
      case 'dragging':
        return svgTheme.colors.success;
      default:
        return this.connected ? svgTheme.colors.port.connected : svgTheme.colors.port.default;
    }
  }

  get strokeColor(): string {
    return svgTheme.colors.stroke.default;
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
    return svgTheme.colors.stroke.default;
  }
}