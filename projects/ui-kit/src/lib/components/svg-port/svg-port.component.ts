import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SVGPortType, SVGPortState, SVGPosition } from '../../types';
import { svgTheme } from '../../theme';

@Component({
  selector: '[svg-port]', // Attribute selector for SVG use
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-port.component.html',
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