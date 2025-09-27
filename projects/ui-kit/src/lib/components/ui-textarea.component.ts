import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Background -->
    <svg:rect
      class="ui-textarea-bg"
      x="0"
      y="0"
      [attr.width]="width"
      [attr.height]="height"
      rx="4"
      ry="4"
      [attr.fill]="backgroundColor"
      [attr.stroke]="borderColor"
      [attr.stroke-width]="borderWidth"
      (click)="focusTextarea()"
    />
    
    <!-- Text display area with clipping -->
    <svg:defs>
      <svg:clipPath [id]="'textarea-clip-' + componentId">
        <svg:rect
          x="8"
          y="8"
          [attr.width]="width - 16"
          [attr.height]="height - 16"
        />
      </svg:clipPath>
    </svg:defs>
    
    <!-- Multi-line text display -->
    <svg:g [attr.clip-path]="'url(#textarea-clip-' + componentId + ')'">
      @for (line of displayLines; track $index; let i = $index) {
        <svg:text
          class="ui-textarea-line"
          x="12"
          [attr.y]="20 + i * lineHeight"
          fill="white"
          font-family="JetBrains Mono, Fira Code, Monaco, Consolas, monospace"
          font-size="12"
          [class.cursor-line]="i === cursorLine && isFocused">
          {{ line }}
        </svg:text>
      }
      
      <!-- Cursor -->
      @if (isFocused) {
        <svg:line
          class="ui-textarea-cursor"
          [attr.x1]="cursorX"
          [attr.y1]="cursorY1"
          [attr.x2]="cursorX"
          [attr.y2]="cursorY2"
          stroke="white"
          stroke-width="1">
        </svg:line>
      }
    </svg:g>
    
    <!-- Hidden textarea for actual input -->
    <foreignObject 
      x="0" 
      y="0"
      [attr.width]="width" 
      [attr.height]="height"
      style="pointer-events: none;">
      <textarea
        #hiddenTextarea
        class="ui-textarea-hidden"
        [value]="value"
        [disabled]="disabled"
        [placeholder]="placeholder"
        (input)="onInput($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onKeydown($event)"
        [style.width]="width + 'px'"
        [style.height]="height + 'px'"
        style="
          opacity: 0;
          position: absolute;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          color: transparent;
          font-family: JetBrains Mono, Fira Code, Monaco, Consolas, monospace;
          font-size: 12px;
          line-height: 16px;
          padding: 8px 12px;
          pointer-events: all;
        "
      ></textarea>
    </foreignObject>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UiTextareaComponent),
      multi: true
    }
  ]
})
export class UiTextareaComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('hiddenTextarea') hiddenTextarea!: ElementRef<HTMLTextAreaElement>;

  @Input() width: number = 300;
  @Input() height: number = 150;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;

  @Output() onEnter = new EventEmitter<string>();
  @Output() onEscape = new EventEmitter<void>();
  @Output() onTextChange = new EventEmitter<string>();

  value: string = '';
  isFocused: boolean = false;
  componentId: string = Math.random().toString(36).substr(2, 9);
  
  lineHeight: number = 16;
  cursorLine: number = 0;
  cursorX: number = 12;
  cursorY1: number = 12;
  cursorY2: number = 28;

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngAfterViewInit() {
    // Set up the hidden textarea
  }

  get displayLines(): string[] {
    if (!this.value) return [''];
    return this.value.split('\n');
  }

  get backgroundColor(): string {
    return this.disabled ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.7)';
  }

  get borderColor(): string {
    if (this.disabled) return 'rgba(255, 255, 255, 0.1)';
    if (this.isFocused) return 'rgba(156, 39, 176, 0.8)';
    return 'rgba(255, 255, 255, 0.2)';
  }

  get borderWidth(): number {
    return this.isFocused ? 2 : 1;
  }

  focusTextarea(): void {
    if (!this.disabled && !this.readonly) {
      this.hiddenTextarea.nativeElement.focus();
    }
  }

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTextChange.emit(this.value);
    this.updateCursor();
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
        if (event.ctrlKey || event.metaKey) {
          this.onEnter.emit(this.value);
          event.preventDefault();
        }
        break;
      case 'Escape':
        this.hiddenTextarea.nativeElement.blur();
        this.onEscape.emit();
        event.preventDefault();
        break;
    }
    
    // Update cursor position after key event
    setTimeout(() => this.updateCursor(), 0);
  }

  private updateCursor(): void {
    const textarea = this.hiddenTextarea?.nativeElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const lines = this.value.substring(0, cursorPos).split('\n');
    
    this.cursorLine = lines.length - 1;
    const currentLine = lines[lines.length - 1];
    
    // Approximate cursor position (would need more precise calculation for exact positioning)
    this.cursorX = 12 + currentLine.length * 7.2; // Approximate char width
    this.cursorY1 = 12 + this.cursorLine * this.lineHeight;
    this.cursorY2 = this.cursorY1 + this.lineHeight;
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    this.updateCursor();
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