import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelVariant } from '../types';

@Component({
  selector: 'ui-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-panel" [class]="panelClasses" [style]="panelStyles">
      @if (title) {
        <div class="ui-panel-header">
          <h3 class="ui-panel-title">{{ title }}</h3>
          @if (closable) {
            <button class="ui-panel-close" (click)="onClose()" type="button">×</button>
          }
        </div>
      }
      <div class="ui-panel-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrl: './panel.component.css'
})
export class UIPanelComponent {
  @Input() variant: PanelVariant = 'default';
  @Input() title?: string;
  @Input() closable: boolean = false;
  @Input() width?: string;
  @Input() height?: string;
  @Input() maxWidth?: string;
  @Input() maxHeight?: string;

  onClose(): void {
    // Emit close event - can be handled by parent
    // For now, just hide the panel
    const panel = document.querySelector('.ui-panel') as HTMLElement;
    if (panel) {
      panel.style.display = 'none';
    }
  }

  get panelClasses(): string {
    const classes = [`ui-panel--${this.variant}`];

    if (this.closable) {
      classes.push('ui-panel--closable');
    }

    return classes.join(' ');
  }

  get panelStyles(): { [key: string]: string } {
    const styles: { [key: string]: string } = {};

    if (this.width) {
      styles['width'] = this.width;
    }

    if (this.height) {
      styles['height'] = this.height;
    }

    if (this.maxWidth) {
      styles['max-width'] = this.maxWidth;
    }

    if (this.maxHeight) {
      styles['max-height'] = this.maxHeight;
    }

    return styles;
  }
}