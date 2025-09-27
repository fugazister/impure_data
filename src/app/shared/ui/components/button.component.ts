import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonVariant, ButtonSize } from '../types';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="ui-button"
      [class]="buttonClasses"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick.emit($event)"
      (mousedown)="onMouseDown.emit($event)"
      (mouseup)="onMouseUp.emit($event)"
    >
      @if (icon) {
        <span class="button-icon">{{ icon }}</span>
      }
      @if (label) {
        <span class="button-label">{{ label }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './button.component.css'
})
export class UIButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() label?: string;
  @Input() icon?: string;
  @Input() disabled: boolean = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() fullWidth: boolean = false;

  @Output() onClick = new EventEmitter<MouseEvent>();
  @Output() onMouseDown = new EventEmitter<MouseEvent>();
  @Output() onMouseUp = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const classes = [
      `ui-button--${this.variant}`,
      `ui-button--${this.size}`
    ];

    if (this.fullWidth) {
      classes.push('ui-button--full-width');
    }

    if (this.disabled) {
      classes.push('ui-button--disabled');
    }

    return classes.join(' ');
  }
}