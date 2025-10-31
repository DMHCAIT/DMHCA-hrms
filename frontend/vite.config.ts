import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/system'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (disable for production)
    sourcemap: false,
  },

  // Development server configuration
  server: {
    port: 5173,
    host: 'localhost',
    // CORS configuration for production API integration
    cors: true,
  },

  // Production optimizations

  // Preview server configuration (for production testing)
  preview: {
    port: 4173,
    host: 'localhost',
  },
})
