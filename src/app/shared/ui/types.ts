// UI Kit Type Definitions

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export type InputVariant = 'default' | 'code' | 'inline';
export type InputSize = 'xs' | 'sm' | 'md' | 'lg';

export type PortType = 'input' | 'output';
export type PortState = 'default' | 'connected' | 'highlighted' | 'dragging';

export type PanelVariant = 'default' | 'dark' | 'transparent';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface UITheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    border: {
      default: string;
      focus: string;
      error: string;
    };
    port: {
      default: string;
      connected: string;
      highlighted: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  typography: {
    fontFamily: {
      mono: string;
      sans: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
}