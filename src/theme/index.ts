import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#3A7AFE',
      light: '#5A8FFF',
      dark: '#2A5AC0',
    },
    secondary: {
      main: '#D4AF37',
      light: '#E5C55E',
      dark: '#B89B2F',
    },
    error: {
      main: '#FF4444',
      light: '#FF6666',
      dark: '#CC3333',
    },
    success: {
      main: '#00D4AA',
      light: '#33DDBB',
      dark: '#00A888',
    },
    background: {
      default: '#0A0A0A',
      paper: '#141414',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#C0C0C0',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Oxygen',
      'Ubuntu',
      'Cantarell',
      'Fira Sans',
      'Droid Sans',
      'Helvetica Neue',
      'sans-serif',
    ].join(','),
    h1: {
      fontFamily: 'GT Sectra Display, Heebo, serif',
      fontWeight: 500,
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: 'GT Sectra Display, Heebo, serif',
      fontWeight: 500,
      fontSize: '2rem',
    },
    h3: {
      fontFamily: 'GT Sectra Display, Heebo, serif',
      fontWeight: 500,
      fontSize: '1.75rem',
    },
    h4: {
      fontFamily: 'GT Sectra Display, Heebo, serif',
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: 'Inter, Heebo, sans-serif',
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: 'Inter, Heebo, sans-serif',
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontFamily: 'Inter, Heebo, sans-serif',
      fontSize: '0.875rem',
    },
    body2: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.813rem',
    },
    caption: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '0.75rem',
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1F1F1F',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
        elevation1: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        },
        elevation2: {
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        },
        elevation3: {
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.07)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0A0A0A',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export const urgencyColors = {
  flash: '#FF4444',
  priority: '#D4AF37',
  monitor: '#3A7AFE',
  context: '#666666',
};

export const sourceColors = {
  government: '#D4AF37',
  military: '#C0C0C0',
  intelligence: '#FFFFFF',
  media_t1: '#3A7AFE',
  media_t2: '#666666',
  social: '#444444',
};