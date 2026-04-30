import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // ── Code Splitting ─────────────────────────────────────────
    // Split vendor libraries into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — changes rarely, cached long-term
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // 3D libraries — HUGE (~1MB+), only needed on landing page
          'vendor-3d': ['three', '@react-three/fiber', '@react-three/drei'],
          // UI animation libraries
          'vendor-ui': ['framer-motion', 'lucide-react'],
          // Stripe — only needed on checkout
          'vendor-stripe': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
        },
      },
    },
    // ── Build Optimization ──────────────────────────────────────
    cssCodeSplit: true,            // split CSS per route
    sourcemap: false,              // no sourcemaps in production
    chunkSizeWarningLimit: 600,    // warn if chunk > 600KB
    target: 'es2020',             // modern browsers only
    minify: 'esbuild',            // fastest minifier
  },
})