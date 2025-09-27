import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="ui-panel-content" [attr.transform]="'translate(' + x + ', ' + y + ')'">
      <ng-content></ng-content>
    </svg:g>
  `
})
export class UiPanelContentComponent {
  @Input() x: number = 0;
  @Input() y: number = 40;
}