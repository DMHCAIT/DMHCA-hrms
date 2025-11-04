import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    
    // Resolve configuration
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@services': resolve(__dirname, 'src/services'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@types': resolve(__dirname, 'src/types'),
      },
    },
    
    // Build optimizations
    build: {
      // Output directory
      outDir: 'dist',
      assetsDir: 'assets',
      
      // Code splitting for better performance
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material', '@mui/system', '@emotion/react'],
            'date-vendor': ['date-fns'],
          },
          // Clean asset naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
            return `js/${facadeModuleId}-[hash].js`
          },
          assetFileNames: 'assets/[name]-[hash].[ext]'
        },
      },
      
      // Performance optimizations
      chunkSizeWarningLimit: 1000,
      sourcemap: mode === 'development',
      minify: mode === 'production' ? 'esbuild' : false,
      
      // Target modern browsers for better optimization
      target: 'es2020',
      
      // Remove console logs in production
      esbuild: {
        drop: mode === 'production' ? ['console', 'debugger'] : [],
      },
    },

    // Development server configuration
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      
      // Proxy API calls to backend in development
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    
    // Preview server configuration (for production preview)
    preview: {
      port: 4173,
      host: '0.0.0.0',
      strictPort: true,
    },
    
    // Environment variables prefix
    envPrefix: 'VITE_',
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    },
  }
})
