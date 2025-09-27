# SVG UI Kit

A comprehensive UI component library designed specifically for SVG canvas environments. This kit provides native SVG components that work seamlessly within SVG contexts without requiring `foreignObject` wrappers.

## Components

### SvgButtonComponent

Interactive buttons rendered as native SVG elements.

```typescript
<svg:g svg-button 
  variant="primary" 
  size="md"
  [position]="{ x: 10, y: 10 }"
  [disabled]="false"
  (onClick)="handleClick($event)">
  Click Me
</svg:g>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `position`: SVGPosition - { x: number, y: number }
- `disabled`: boolean

### SvgPortComponent

Connection ports for node-based interfaces.

```typescript
<svg:g svg-port 
  portId="input-1"
  type="input"
  [position]="{ x: 0, y: 20 }"
  state="default"
  label="Data Input"
  [connected]="false"
  (onMouseDown)="startConnection($event)"
  (onMouseUp)="endConnection($event)">
</svg:g>
```

**Props:**
- `portId`: string - Unique identifier
- `type`: 'input' | 'output'
- `state`: 'default' | 'connected' | 'highlighted' | 'dragging'
- `position`: SVGPosition
- `label`: string (optional)
- `connected`: boolean

### SvgInputComponent

Text input fields within SVG canvas.

```typescript
<svg:g svg-input
  size="medium"
  variant="default"
  [position]="{ x: 50, y: 50 }"
  placeholder="Enter text..."
  [width]="120"
  [(ngModel)]="inputValue"
  (onEnter)="handleEnter($event)">
</svg:g>
```

**Props:**
- `size`: 'small' | 'medium' | 'large'
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `position`: SVGPosition
- `width`: number
- `placeholder`: string
- `disabled`: boolean

### SvgPanelComponent

Container panels for grouping UI elements.

```typescript
<svg:g svg-panel
  [width]="200"
  [height]="150"
  [position]="{ x: 100, y: 100 }"
  variant="default"
  title="Properties"
  [showCloseButton]="true"
  [shadow]="true">
  
  <!-- Panel content -->
  <svg:g svg-button variant="primary" size="sm" [position]="{ x: 10, y: 10 }">
    Save
  </svg:g>
  
</svg:g>
```

**Props:**
- `width`: number (required)
- `height`: number (required)
- `position`: SVGPosition
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger'
- `title`: string (optional)
- `showCloseButton`: boolean
- `shadow`: boolean

## Services

### SvgUIService

Utility service for managing SVG component interactions, selection, and drag operations.

```typescript
constructor(private svgUI: SvgUIService) {}

// Register a component
this.svgUI.registerComponent('node-1', { x: 100, y: 100 });

// Handle selection
this.svgUI.selectComponent('node-1');

// Handle dragging
this.svgUI.startDrag('node-1', { x: 100, y: 100 });
this.svgUI.updateDrag({ x: 120, y: 120 });
this.svgUI.endDrag();
```

## Theming

The SVG UI Kit uses a comprehensive theme system defined in `theme.ts`:

```typescript
export const svgTheme: SVGTheme = {
  colors: {
    primary: '#007ACC',
    secondary: '#6C757D',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    // ... more colors
  },
  sizes: {
    button: {
      xs: { width: 16, height: 16, fontSize: 9 },
      sm: { width: 20, height: 18, fontSize: 10 },
      md: { width: 24, height: 20, fontSize: 11 },
      lg: { width: 32, height: 24, fontSize: 12 }
    },
    // ... more sizes
  },
  // ...
};
```

### Custom Themes

You can customize the theme by modifying the `svgTheme` object or creating your own theme implementation.

## Usage in Node Editor

This SVG UI Kit is specifically designed for use within SVG canvas environments like node editors:

```typescript
<svg width="800" height="600" viewBox="0 0 800 600">
  <!-- Node with SVG UI components -->
  <svg:g class="node" [attr.transform]="nodeTransform">
    
    <!-- Node background -->
    <svg:g svg-panel [width]="nodeWidth" [height]="nodeHeight" variant="default">
      
      <!-- Input ports -->
      <svg:g svg-port 
        portId="input-1" 
        type="input" 
        [position]="{ x: -6, y: 20 }">
      </svg:g>
      
      <!-- Node content -->
      <svg:g svg-input 
        [position]="{ x: 20, y: 15 }"
        [(ngModel)]="nodeValue">
      </svg:g>
      
      <!-- Action button -->
      <svg:g svg-button 
        variant="primary" 
        size="sm" 
        [position]="{ x: 150, y: 45 }"
        (onClick)="executeNode()">
        Execute
      </svg:g>
      
      <!-- Output ports -->
      <svg:g svg-port 
        portId="output-1" 
        type="output" 
        [position]="{ x: nodeWidth + 6, y: 20 }">
      </svg:g>
      
    </svg:g>
  </svg:g>
</svg>
```

## Architecture Benefits

1. **Native SVG**: No `foreignObject` wrappers - better performance and compatibility
2. **Canvas Integration**: Components work seamlessly within SVG transformations
3. **Event Handling**: Proper SVG event propagation and coordinate handling
4. **Theming**: Consistent styling system across all components
5. **TypeScript**: Full type safety and IntelliSense support
6. **Angular Integration**: Reactive forms, change detection, and lifecycle hooks

## Installation

Import the SVG UI Kit components into your Angular module or use them directly in standalone components:

```typescript
import { 
  SvgButtonComponent,
  SvgPortComponent,
  SvgInputComponent,
  SvgPanelComponent,
  SvgUIService
} from './shared/svg-ui';

@Component({
  // ...
  imports: [
    SvgButtonComponent,
    SvgPortComponent,
    SvgInputComponent,
    SvgPanelComponent
  ],
  // ...
})
```