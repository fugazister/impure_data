import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SVGButtonVariant, SVGButtonSize, SVGPosition } from '../../types';
import { svgTheme } from '../../theme';

@Component({
  selector: '[svg-button]', // Attribute selector for SVG use
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-button.component.html',
  styleUrl: './svg-button.component.css'
})
export class SvgButtonComponent {
  @Input() variant: SVGButtonVariant = 'primary';
  @Input() size: SVGButtonSize = 'md';
  @Input() position: SVGPosition = { x: 0, y: 0 };
  @Input() label?: string;
  @Input() icon?: string;
  @Input() disabled: boolean = false;

  @Output() onClick = new EventEmitter<MouseEvent>();
  @Output() onHover = new EventEmitter<boolean>();

  get transform(): string {
    return `translate(${this.position.x}, ${this.position.y})`;
  }

  get buttonClasses(): string {
    const classes = [
      `svg-button--${this.variant}`,
      `svg-button--${this.size}`
    ];

    if (this.disabled) {
      classes.push('svg-button--disabled');
    }

    return classes.join(' ');
  }

  get buttonSize() {
    return svgTheme.sizes.button[this.size];
  }

  get borderRadius(): number {
    return 3;
  }

  get fillColor(): string {
    if (this.disabled) return '#999999';
    
    switch (this.variant) {
      case 'primary': return svgTheme.colors.primary;
      case 'secondary': return svgTheme.colors.secondary;
      case 'success': return svgTheme.colors.success;
      case 'warning': return svgTheme.colors.warning;
      case 'danger': return svgTheme.colors.danger;
      case 'ghost': return 'transparent';
      default: return svgTheme.colors.primary;
    }
  }

  get strokeColor(): string {
    return this.variant === 'ghost' ? svgTheme.colors.stroke.default : 'none';
  }

  get strokeWidth(): number {
    return this.variant === 'ghost' ? 1 : 0;
  }

  get iconX(): number {
    if (this.icon && this.label) {
      return this.buttonSize.width * 0.25; // Left side if both icon and label
    }
    return this.buttonSize.width / 2; // Center if icon only
  }

  get iconY(): number {
    return this.buttonSize.height / 2;
  }

  get labelX(): number {
    if (this.icon && this.label) {
      return this.buttonSize.width * 0.65; // Right side if both icon and label
    }
    return this.buttonSize.width / 2; // Center if label only
  }

  get labelY(): number {
    return this.buttonSize.height / 2;
  }

  get textAnchor(): string {
    if (this.icon && this.label) {
      return 'start'; // Left-align if icon is present
    }
    return 'middle'; // Center if no icon
  }
}