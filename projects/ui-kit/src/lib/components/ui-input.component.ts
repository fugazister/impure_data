import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SvgInputComponent } from './svg-input.component';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInputComponent],
  template: `
    <svg:g svg-input
      [size]="size"
      [variant]="variant"
      [position]="position"
      [width]="width"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [ngModel]="value"
      (ngModelChange)="onValueChange($event)"
      (onEnter)="onEnter.emit($event)"
      (onEscape)="onEscape.emit()">
    </svg:g>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiInputComponent),
      multi: true
    }
  ]
})
export class UiInputComponent implements ControlValueAccessor {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'default' | 'primary' | 'success' | 'warning' | 'danger' = 'default';
  @Input() position: { x: number; y: number } = { x: 0, y: 0 };
  @Input() width: number = 120;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;

  @Output() onEnter = new EventEmitter<string>();
  @Output() onEscape = new EventEmitter<void>();

  value: string = '';
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  onValueChange(value: string): void {
    this.value = value;
    this.onChange(value);
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}