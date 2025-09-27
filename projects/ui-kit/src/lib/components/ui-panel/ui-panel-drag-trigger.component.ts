import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-drag-trigger',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-panel-drag-trigger.component.html'
})
export class UiPanelDragTriggerComponent {
  @Input() x: number = 8;
  @Input() y: number = 10;
}