import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-panel-header.component.html'
})
export class UiPanelHeaderComponent {
  @Input() width: number = 200;
  @Output() onMouseDown = new EventEmitter<MouseEvent>();
}