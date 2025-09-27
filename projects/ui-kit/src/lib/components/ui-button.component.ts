import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgButtonComponent } from './svg-button.component';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule, SvgButtonComponent],
  template: `
    <svg:g svg-button
      [variant]="variant"
      [size]="size"
      [position]="position"
      [disabled]="disabled"
      (onClick)="onClick.emit($event)">
      <ng-content></ng-content>
    </svg:g>
  `
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' | 'danger' = 'primary';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() disabled: boolean = false;

  @Output() onClick = new EventEmitter<MouseEvent>();
}