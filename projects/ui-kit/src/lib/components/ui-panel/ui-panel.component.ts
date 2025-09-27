import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgPanelComponent } from '../svg-panel/svg-panel.component';

@Component({
  selector: 'ui-panel',
  standalone: true,
  imports: [CommonModule, SvgPanelComponent],
  templateUrl: './ui-panel.component.html'
})
export class UiPanelComponent {
  @Input() width: number = 200;
  @Input() height: number = 150;
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
}