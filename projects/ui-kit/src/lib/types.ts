// SVG UI Kit Types - designed for SVG context

export type SVGButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type SVGButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export type SVGPortType = 'input' | 'output';
export type SVGPortState = 'default' | 'connected' | 'highlighted' | 'dragging';

export type SVGInputVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export type SVGInputSize = 'small' | 'medium' | 'large';

export type SVGPanelVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface SVGPosition {
  x: number;
  y: number;
}

export interface SVGSize {
  width: number;
  height: number;
}

export interface SVGTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    danger: string;
    port: {
      default: string;
      connected: string;
      highlighted: string;
    };
    stroke: {
      default: string;
      focus: string;
      error: string;
      disabled: string;
    };
    text: {
      primary: string;
      secondary: string;
      muted: string;
      disabled: string;
    };
    button: {
      background: string;
    };
    input: {
      background: string;
      disabled: string;
    };
    panel: {
      background: string;
      primaryBackground: string;
      successBackground: string;
      warningBackground: string;
      dangerBackground: string;
    };
  };
  borderRadius: number;
  sizes: {
    port: {
      radius: number;
      strokeWidth: number;
    };
    button: {
      xs: { width: number; height: number; fontSize: number };
      sm: { width: number; height: number; fontSize: number };
      md: { width: number; height: number; fontSize: number };
      lg: { width: number; height: number; fontSize: number };
    };
    input: {
      small: { height: number; fontSize: number };
      medium: { height: number; fontSize: number };
      large: { height: number; fontSize: number };
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
  };
}

export interface SVGButtonConfig {
  variant: SVGButtonVariant;
  size: SVGButtonSize;
  position: SVGPosition;
  label?: string;
  icon?: string;
  disabled?: boolean;
}