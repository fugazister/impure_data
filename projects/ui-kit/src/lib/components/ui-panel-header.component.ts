import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="ui-panel-header" transform="translate(0, 0)">
      <svg:rect
        class="ui-panel-header-bg"
        x="0"
        y="0"
        [attr.width]="width"
        height="40"
        rx="4"
        ry="4"
        (mousedown)="onMouseDown.emit($event)"
      />
      <ng-content></ng-content>
    </svg:g>
  `
})
export class UiPanelHeaderComponent {
  @Input() width: number = 200;
  @Output() onMouseDown = new EventEmitter<MouseEvent>();
}