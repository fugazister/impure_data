import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SVGInputSize, SVGInputVariant, SVGPosition } from '../types';
import { svgTheme } from '../theme';

@Component({
  selector: '[svg-input]', // Attribute selector for SVG use
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg:g 
      class="svg-input"
      [class]="inputClasses"
      [attr.transform]="transform"
    >
      <!-- Background rect -->
      <svg:rect
        class="svg-input-bg"
        x="0"
        y="0"
        [attr.width]="width"
        [attr.height]="height"
        [attr.fill]="backgroundColor"
        [attr.stroke]="borderColor"
        [attr.stroke-width]="borderWidth"
        [attr.rx]="borderRadius"
        (click)="focusInput()"
      />
      
      <!-- Input text display -->
      <svg:text
        class="svg-input-text"
        [attr.x]="textX"
        [attr.y]="textY"
        [attr.font-size]="fontSize"
        [attr.fill]="textColor"
        [attr.text-anchor]="'start'"
        (click)="focusInput()"
      >
        {{ displayValue || placeholder }}
      </svg:text>
      
      <!-- Cursor (when focused) -->
      @if (isFocused) {
        <svg:line
          class="svg-input-cursor"
          [attr.x1]="cursorX"
          [attr.y1]="cursorY1"
          [attr.x2]="cursorX"
          [attr.y2]="cursorY2"
          [attr.stroke]="cursorColor"
          [attr.stroke-width]="1"
        />
      }
    </svg:g>
    
    <!-- Hidden HTML input for actual text input -->
    <input
      #hiddenInput
      type="text"
      class="svg-input-hidden"
      [value]="value"
      [disabled]="disabled"
      [placeholder]="placeholder"
      (input)="onInput($event)"
      (focus)="onFocus()"
      (blur)="onBlur()"
      (keydown)="onKeydown($event)"
    />
  `,
  styleUrl: './svg-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SvgInputComponent),
      multi: true
    }
  ]
})
export class SvgInputComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('hiddenInput') hiddenInput!: ElementRef<HTMLInputElement>;

  @Input() size: SVGInputSize = 'medium';
  @Input() variant: SVGInputVariant = 'default';
  @Input() position: SVGPosition = { x: 0, y: 0 };
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() maxLength?: number;
  @Input() width: number = 120;

  @Output() onInputChange = new EventEmitter<string>();
  @Output() onEnter = new EventEmitter<string>();
  @Output() onEscape = new EventEmitter<void>();

  value: string = '';
  isFocused: boolean = false;
  
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngAfterViewInit() {
    // Position the hidden input off-screen but keep it accessible
    const input = this.hiddenInput.nativeElement;
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
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

  get transform(): string {
    return `translate(${this.position.x}, ${this.position.y})`;
  }

  get inputClasses(): string {
    const classes = [
      `svg-input--${this.size}`,
      `svg-input--${this.variant}`
    ];

    if (this.disabled) {
      classes.push('svg-input--disabled');
    }

    if (this.isFocused) {
      classes.push('svg-input--focused');
    }

    return classes.join(' ');
  }

  get height(): number {
    return svgTheme.sizes.input[this.size].height;
  }

  get fontSize(): number {
    return svgTheme.sizes.input[this.size].fontSize;
  }

  get borderRadius(): number {
    return svgTheme.borderRadius;
  }

  get borderWidth(): number {
    return this.isFocused ? 2 : 1;
  }

  get backgroundColor(): string {
    if (this.disabled) {
      return svgTheme.colors.input.disabled;
    }
    return svgTheme.colors.input.background;
  }

  get borderColor(): string {
    if (this.disabled) {
      return svgTheme.colors.stroke.disabled;
    }
    if (this.isFocused) {
      return svgTheme.colors.primary;
    }
    return svgTheme.colors.stroke.default;
  }

  get textColor(): string {
    if (this.disabled) {
      return svgTheme.colors.text.disabled;
    }
    if (!this.value && this.placeholder) {
      return svgTheme.colors.text.muted;
    }
    return svgTheme.colors.text.primary;
  }

  get cursorColor(): string {
    return svgTheme.colors.primary;
  }

  get textX(): number {
    return 8; // Padding from left
  }

  get textY(): number {
    return this.height / 2 + this.fontSize / 3; // Vertically centered
  }

  get displayValue(): string {
    return this.value;
  }

  get cursorX(): number {
    // Calculate cursor position based on text width
    // This is approximate - in a real implementation, you'd measure the text
    const textWidth = this.value.length * (this.fontSize * 0.6);
    return this.textX + textWidth;
  }

  get cursorY1(): number {
    return 6;
  }

  get cursorY2(): number {
    return this.height - 6;
  }

  focusInput(): void {
    if (!this.disabled) {
      this.hiddenInput.nativeElement.focus();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newValue = target.value;
    
    if (this.maxLength && newValue.length > this.maxLength) {
      target.value = newValue.substring(0, this.maxLength);
      return;
    }

    this.value = newValue;
    this.onChange(this.value);
    this.onInputChange.emit(this.value);
  }

  onFocus(): void {
    this.isFocused = true;
  }

  onBlur(): void {
    this.isFocused = false;
    this.onTouched();
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Enter':
        this.onEnter.emit(this.value);
        break;
      case 'Escape':
        this.hiddenInput.nativeElement.blur();
        this.onEscape.emit();
        break;
    }
  }
}