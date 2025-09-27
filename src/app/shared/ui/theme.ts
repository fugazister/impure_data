import { UITheme } from './types';

export const defaultTheme: UITheme = {
  colors: {
    primary: '#007acc',
    secondary: '#6c757d',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#f44336',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: {
      primary: '#333333',
      secondary: '#666666',
      disabled: '#999999',
      inverse: '#ffffff'
    },
    border: {
      default: '#ddd',
      focus: '#007acc',
      error: '#f44336'
    },
    port: {
      default: '#cccccc',
      connected: '#007acc',
      highlighted: '#FF9800'
    }
  },
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px'
  },
  borderRadius: {
    xs: '2px',
    sm: '3px',
    md: '4px',
    lg: '8px',
    full: '50%'
  },
  typography: {
    fontFamily: {
      mono: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
      sans: 'Arial, sans-serif'
    },
    fontSize: {
      xs: '9px',
      sm: '10px',
      md: '11px',
      lg: '12px',
      xl: '14px'
    }
  }
};

export const darkTheme: UITheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    background: '#1e1e1e',
    surface: '#2d2d2d',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      disabled: '#888888',
      inverse: '#333333'
    },
    border: {
      default: '#444444',
      focus: '#007acc',
      error: '#f44336'
    }
  }
};