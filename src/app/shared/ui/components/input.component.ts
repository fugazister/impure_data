import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { InputVariant, InputSize } from '../types';

@Component({
  selector: 'ui-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-input-container" [class]="containerClasses">
      @if (label) {
        <label class="ui-input-label" [for]="inputId">{{ label }}</label>
      }
      <input
        [id]="inputId"
        class="ui-input"
        [class]="inputClasses"
        [type]="type"
        [value]="value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [autocomplete]="autocomplete"
        [autofocus]="autofocus"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
        (focus)="onFocus($event)"
        (keydown)="onKeyDown($event)"
        (keyup)="onKeyUp($event)"
      />
      @if (error) {
        <div class="ui-input-error">{{ error }}</div>
      }
      @if (hint && !error) {
        <div class="ui-input-hint">{{ hint }}</div>
      }
    </div>
  `,
  styleUrl: './input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UIInputComponent),
      multi: true
    }
  ]
})
export class UIInputComponent implements ControlValueAccessor {
  @Input() variant: InputVariant = 'default';
  @Input() size: InputSize = 'md';
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() hint?: string;
  @Input() error?: string;
  @Input() type: string = 'text';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() autofocus: boolean = false;
  @Input() autocomplete: string = 'off';
  @Input() fullWidth: boolean = true;

  @Output() onInputEvent = new EventEmitter<Event>();
  @Output() onBlurEvent = new EventEmitter<FocusEvent>();
  @Output() onFocusEvent = new EventEmitter<FocusEvent>();
  @Output() onKeyDownEvent = new EventEmitter<KeyboardEvent>();
  @Output() onKeyUpEvent = new EventEmitter<KeyboardEvent>();

  value: string = '';
  inputId: string = `ui-input-${Math.random().toString(36).substr(2, 9)}`;

  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  private onTouched = () => {};

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

  // Event handlers
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onInputEvent.emit(event);
  }

  onBlur(event: FocusEvent): void {
    this.onTouched();
    this.onBlurEvent.emit(event);
  }

  onFocus(event: FocusEvent): void {
    this.onFocusEvent.emit(event);
  }

  onKeyDown(event: KeyboardEvent): void {
    this.onKeyDownEvent.emit(event);
  }

  onKeyUp(event: KeyboardEvent): void {
    this.onKeyUpEvent.emit(event);
  }

  // Computed classes
  get containerClasses(): string {
    const classes = [`ui-input-container--${this.variant}`];

    if (this.fullWidth) {
      classes.push('ui-input-container--full-width');
    }

    if (this.error) {
      classes.push('ui-input-container--error');
    }

    return classes.join(' ');
  }

  get inputClasses(): string {
    const classes = [
      `ui-input--${this.variant}`,
      `ui-input--${this.size}`
    ];

    if (this.disabled) {
      classes.push('ui-input--disabled');
    }

    if (this.readonly) {
      classes.push('ui-input--readonly');
    }

    if (this.error) {
      classes.push('ui-input--error');
    }

    return classes.join(' ');
  }
}