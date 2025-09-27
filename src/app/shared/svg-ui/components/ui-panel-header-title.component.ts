import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-header-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:text
      class="ui-panel-header-title"
      [attr.x]="x"
      [attr.y]="y"
      fill="white"
      font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
      font-size="12"
      font-weight="bold">
      <ng-content></ng-content>
    </svg:text>
  `
})
export class UiPanelHeaderTitleComponent {
  @Input() x: number = 8;
  @Input() y: number = 25;
}