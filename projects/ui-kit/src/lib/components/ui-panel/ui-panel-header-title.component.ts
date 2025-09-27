import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-header-title',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-panel-header-title.component.html'
})
export class UiPanelHeaderTitleComponent {
  @Input() x: number = 8;
  @Input() y: number = 25;
}