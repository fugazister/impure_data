// UI Kit Components Export
export { UIButtonComponent } from './components/button.component';
export { UIInputComponent } from './components/input.component';
export { UIPortComponent } from './components/port.component';
export { UIPanelComponent } from './components/panel.component';

// UI Kit Types Export
export * from './types';

// UI Kit Theme Export
export { defaultTheme, darkTheme } from './theme';

// Re-import for array
import { UIButtonComponent } from './components/button.component';
import { UIInputComponent } from './components/input.component';
import { UIPortComponent } from './components/port.component';
import { UIPanelComponent } from './components/panel.component';

// UI Kit Components Array for easy imports
export const UI_COMPONENTS = [
  UIButtonComponent,
  UIInputComponent,
  UIPortComponent,
  UIPanelComponent
] as const;