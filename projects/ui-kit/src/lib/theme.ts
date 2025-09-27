import { SVGTheme } from './types';

export const svgTheme: SVGTheme = {
  colors: {
    primary: '#007ACC',
    secondary: '#6C757D',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    port: {
      default: '#E0E0E0',
      connected: '#4CAF50',
      highlighted: '#FF9800',
    },
    stroke: {
      default: '#CCCCCC',
      focus: '#007ACC',
      error: '#F44336',
      disabled: '#E0E0E0',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
      muted: '#999999',
      disabled: '#CCCCCC',
    },
    button: {
      background: '#FFFFFF',
    },
    input: {
      background: '#FFFFFF',
      disabled: '#F5F5F5',
    },
    panel: {
      background: '#FFFFFF',
      primaryBackground: '#F0F8FF',
      successBackground: '#F1F8E9',
      warningBackground: '#FFF8E1',
      dangerBackground: '#FFEBEE',
    },
  },
  borderRadius: 4,
  sizes: {
    port: {
      radius: 4,
      strokeWidth: 1
    },
    button: {
      xs: { width: 16, height: 16, fontSize: 9 },
      sm: { width: 20, height: 18, fontSize: 10 },
      md: { width: 24, height: 20, fontSize: 11 },
      lg: { width: 32, height: 24, fontSize: 12 }
    },
    input: {
      small: { height: 24, fontSize: 11 },
      medium: { height: 28, fontSize: 12 },
      large: { height: 32, fontSize: 14 }
    }
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16
  }
};