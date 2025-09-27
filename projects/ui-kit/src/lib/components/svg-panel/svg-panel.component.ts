import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SVGPanelVariant, SVGPosition } from '../../types';
import { svgTheme } from '../../theme';

@Component({
  selector: '[svg-panel]', // Attribute selector for SVG use
  standalone: true,
  imports: [CommonModule],
  templateUrl: './svg-panel.component.html',
  styleUrl: './svg-panel.component.css'
})
export class SvgPanelComponent {
  @Input({ required: true }) width!: number;
  @Input({ required: true }) height!: number;
  @Input() position: SVGPosition = { x: 0, y: 0 };
  @Input() variant: SVGPanelVariant = 'default';
  @Input() title?: string;
  @Input() showCloseButton: boolean = false;
  @Input() shadow: boolean = true;
  @Input() padding: number = 12;

  onClose(): void {
    // Emit close event - parent component should handle this
    console.log('Panel close clicked');
  }

  get transform(): string {
    return `translate(${this.position.x}, ${this.position.y})`;
  }

  get panelClasses(): string {
    const classes = [`svg-panel--${this.variant}`];
    
    if (this.shadow) {
      classes.push('svg-panel--shadow');
    }
    
    return classes.join(' ');
  }

  get headerHeight(): number {
    return this.title || this.showCloseButton ? 32 : 0;
  }

  get borderRadius(): number {
    return svgTheme.borderRadius;
  }

  get borderWidth(): number {
    return 1;
  }

  get backgroundColor(): string {
    switch (this.variant) {
      case 'primary':
        return svgTheme.colors.panel.primaryBackground;
      case 'success':
        return svgTheme.colors.panel.successBackground;
      case 'warning':
        return svgTheme.colors.panel.warningBackground;
      case 'danger':
        return svgTheme.colors.panel.dangerBackground;
      default:
        return svgTheme.colors.panel.background;
    }
  }

  get borderColor(): string {
    switch (this.variant) {
      case 'primary':
        return svgTheme.colors.primary;
      case 'success':
        return svgTheme.colors.success;
      case 'warning':
        return svgTheme.colors.warning;
      case 'danger':
        return svgTheme.colors.danger;
      default:
        return svgTheme.colors.stroke.default;
    }
  }

  get headerBackgroundColor(): string {
    switch (this.variant) {
      case 'primary':
        return svgTheme.colors.primary + '20'; // 20% opacity
      case 'success':
        return svgTheme.colors.success + '20';
      case 'warning':
        return svgTheme.colors.warning + '20';
      case 'danger':
        return svgTheme.colors.danger + '20';
      default:
        return svgTheme.colors.stroke.default + '10';
    }
  }

  get shadowFilter(): string {
    return this.shadow ? 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15))' : 'none';
  }

  get titleX(): number {
    return this.padding;
  }

  get titleY(): number {
    return 20; // Vertically centered in header
  }

  get titleFontSize(): number {
    return 12;
  }

  get titleColor(): string {
    return svgTheme.colors.text.primary;
  }

  get closeButtonTransform(): string {
    const x = this.width - 20;
    const y = 16;
    return `translate(${x}, ${y})`;
  }

  get closeButtonColor(): string {
    return svgTheme.colors.button.background;
  }

  get closeButtonStroke(): string {
    return svgTheme.colors.stroke.default;
  }

  get closeIconColor(): string {
    return svgTheme.colors.text.primary;
  }

  get contentTransform(): string {
    const y = this.headerHeight + (this.headerHeight > 0 ? this.padding / 2 : 0);
    return `translate(${this.padding}, ${y})`;
  }
}