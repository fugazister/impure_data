import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-drag-trigger',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g class="ui-panel-drag-trigger" [attr.transform]="'translate(' + x + ', ' + y + ')'">
      <svg:rect
        class="drag-handle-bg"
        x="0"
        y="0"
        width="80"
        height="20"
        rx="2"
        fill="rgba(255, 255, 255, 0.1)"
      />
      <svg:text
        class="drag-handle-text"
        x="4"
        y="14"
        fill="rgba(255, 255, 255, 0.6)"
        font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
        font-size="10">
        ⋮⋮⋮ Drag to move
      </svg:text>
    </svg:g>
  `
})
export class UiPanelDragTriggerComponent {
  @Input() x: number = 8;
  @Input() y: number = 10;
}