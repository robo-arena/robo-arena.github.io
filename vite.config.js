import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://34.55.101.123:5000',
        changeOrigin: true,
        secure: false,
        // ✨ strip the leading /api before forwarding
        rewrite: (p) => p, 
      },
    },
  },
  build: {
    outDir: 'docs',        // put the static files in /docs
    emptyOutDir: true,
  },
})
