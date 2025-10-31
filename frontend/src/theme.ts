import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1e3a8a', // Professional blue
      light: '#3b82f6',
      dark: '#1e40af',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#059669', // Professional green
      light: '#10b981',
      dark: '#047857',
      contrastText: '#ffffff',
    },
    error: {
      main: '#dc2626',
      light: '#ef4444',
      dark: '#b91c1c',
    },
    warning: {
      main: '#d97706',
      light: '#f59e0b',
      dark: '#b45309',
    },
    info: {
      main: '#0284c7',
      light: '#0ea5e9',
      dark: '#0369a1',
    },
    success: {
      main: '#059669',
      light: '#10b981',
      dark: '#047857',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 10px 15px rgba(0, 0, 0, 0.10)',
    '0px 20px 25px rgba(0, 0, 0, 0.10)',
    '0px 25px 50px rgba(0, 0, 0, 0.15)',
    '0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 4px 8px rgba(0, 0, 0, 0.06)',
    '0px 8px 16px rgba(0, 0, 0, 0.06)',
    '0px 16px 24px rgba(0, 0, 0, 0.06)',
    '0px 20px 40px rgba(0, 0, 0, 0.07)',
    '0px 24px 48px rgba(0, 0, 0, 0.08)',
    '0px 32px 64px rgba(0, 0, 0, 0.08)',
    '0px 40px 80px rgba(0, 0, 0, 0.08)',
    '0px 48px 96px rgba(0, 0, 0, 0.08)',
    '0px 56px 112px rgba(0, 0, 0, 0.08)',
    '0px 64px 128px rgba(0, 0, 0, 0.08)',
    '0px 72px 144px rgba(0, 0, 0, 0.08)',
    '0px 80px 160px rgba(0, 0, 0, 0.08)',
    '0px 88px 176px rgba(0, 0, 0, 0.08)',
    '0px 96px 192px rgba(0, 0, 0, 0.08)',
    '0px 104px 208px rgba(0, 0, 0, 0.08)',
    '0px 112px 224px rgba(0, 0, 0, 0.08)',
    '0px 120px 240px rgba(0, 0, 0, 0.08)',
    '0px 128px 256px rgba(0, 0, 0, 0.08)',
  ],
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.05)',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          padding: '8px 16px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e2e8f0',
        },
      },
    },
  },
});

export default theme;