# Node Editor UI Kit

A comprehensive UI kit for building consistent, maintainable node editor interfaces.

## Overview

The UI Kit provides a set of reusable components that eliminate the need for repetitive SVG code and inline styles. It includes theming support, TypeScript interfaces, and follows Angular best practices.

## Components

### UIButtonComponent

A versatile button component with multiple variants and sizes.

```html
<!-- Basic usage -->
<ui-button 
  variant="primary" 
  size="md" 
  label="Execute"
  (onClick)="executeNode()"
/>

<!-- With icon -->
<ui-button 
  variant="success" 
  size="sm" 
  icon="✓"
  label="Done"
/>

<!-- Icon only -->
<ui-button 
  variant="ghost" 
  size="xs" 
  icon="✏️"
  (onClick)="editNode()"
/>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `label`: Optional button text
- `icon`: Optional icon character/emoji
- `disabled`: Boolean
- `fullWidth`: Boolean

### UIInputComponent

A form input component with validation and theming support.

```html
<!-- Basic input -->
<ui-input 
  variant="default"
  placeholder="Enter function name"
  [(ngModel)]="functionName"
/>

<!-- Code input -->
<ui-input 
  variant="code"
  label="Custom Code"
  [(ngModel)]="customCode"
  (onKeyDownEvent)="handleCodeKeyDown($event)"
/>

<!-- Inline input (for SVG foreignObject) -->
<ui-input 
  variant="inline"
  size="sm"
  [(ngModel)]="nodeLabel"
/>
```

**Props:**
- `variant`: 'default' | 'code' | 'inline'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `label`: Optional label text
- `placeholder`: Placeholder text
- `error`: Error message to display
- `hint`: Helpful hint text
- `disabled`: Boolean
- `readonly`: Boolean

### UIPortComponent

A port component for node connections with state management.

```html
<!-- Input port -->
<ui-port
  [portId]="input.id"
  type="input"
  [position]="{ x: 0, y: getPortY(i) }"
  [label]="input.label"
  [connected]="isPortConnected(input.id, 'input')"
  [state]="getPortState(input.id, 'input')"
  (onMouseDown)="handlePortMouseDown($event)"
/>

<!-- Output port -->
<ui-port
  [portId]="output.id"
  type="output"
  [position]="{ x: nodeWidth, y: getPortY(i) }"
  [label]="output.label"
  [connected]="isPortConnected(output.id, 'output')"
/>
```

**Props:**
- `portId`: Unique identifier for the port
- `type`: 'input' | 'output'
- `position`: { x: number, y: number }
- `label`: Port label text
- `connected`: Boolean connection state
- `state`: 'default' | 'connected' | 'highlighted' | 'dragging'
- `showConnectionWarning`: Boolean

### UIPanelComponent

A panel component for overlays, dialogs, and floating UI elements.

```html
<!-- Basic panel -->
<ui-panel 
  variant="default"
  title="Node Properties"
  [closable]="true"
>
  <p>Panel content goes here</p>
</ui-panel>

<!-- Dark panel for code editing -->
<ui-panel 
  variant="dark"
  title="Code Editor"
  width="400px"
  height="300px"
>
  <ui-input variant="code" [(ngModel)]="code" />
</ui-panel>

<!-- Transparent overlay -->
<ui-panel 
  variant="transparent"
  maxWidth="600px"
>
  <div>Overlay content with backdrop blur</div>
</ui-panel>
```

**Props:**
- `variant`: 'default' | 'dark' | 'transparent'
- `title`: Optional panel title
- `closable`: Boolean - shows close button
- `width`, `height`: CSS size values
- `maxWidth`, `maxHeight`: CSS max-size values

## Theming

The UI Kit includes a comprehensive theming system:

```typescript
import { defaultTheme, darkTheme } from '@/shared/ui';

// Access theme values
const primaryColor = defaultTheme.colors.primary;
const spacing = defaultTheme.spacing.md;
const borderRadius = defaultTheme.borderRadius.sm;
```

## Migration Guide

### Before (SVG-heavy approach):

```html
<svg:g class="port input-port">
  <svg:circle
    class="port-circle"
    [attr.cx]="0"
    [attr.cy]="0"
    r="4"
    [attr.fill]="getInputPortFill(input)"
    [attr.stroke]="getInputPortStroke()"
    (mousedown)="onPortMouseDown($event, input.id, 'input')"
  />
  <svg:text class="port-label" x="8" y="3">
    {{ input.label }}
  </svg:text>
</svg:g>
```

### After (UI Kit approach):

```html
<ui-port
  [portId]="input.id"
  type="input"
  [position]="{ x: 0, y: getPortY(i) }"
  [label]="input.label"
  [connected]="isConnected(input.id)"
  (onMouseDown)="onPortMouseDown($event)"
/>
```

## Benefits

1. **Consistency**: Unified styling and behavior across all components
2. **Maintainability**: Changes to the UI kit automatically apply everywhere
3. **Developer Experience**: TypeScript interfaces, clear APIs, and documentation
4. **Performance**: Optimized components with proper change detection
5. **Accessibility**: Built-in ARIA support and keyboard navigation
6. **Theming**: Easy to customize colors, spacing, and typography

## Best Practices

1. **Use semantic component names**: Prefer `<ui-button>` over `<div class="button">`
2. **Leverage variants**: Use component variants instead of custom CSS classes
3. **Follow the theme**: Use theme values for consistent spacing and colors
4. **Handle events properly**: Use the provided event emitters for interactions
5. **Test with different states**: Ensure components work in all states (disabled, error, etc.)

## Future Enhancements

- [ ] Textarea component for multi-line input
- [ ] Dropdown/Select component
- [ ] Modal component with backdrop
- [ ] Tooltip component
- [ ] Icon system integration
- [ ] Animation utilities
- [ ] Responsive utilities
- [ ] Form validation helpers