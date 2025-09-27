import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-panel-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ui-panel-content.component.html'
})
export class UiPanelContentComponent {
  @Input() x: number = 0;
  @Input() y: number = 40;
}