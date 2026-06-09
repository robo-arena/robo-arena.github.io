import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devApiProxyTarget = process.env.VITE_DEV_API_PROXY_TARGET || 'http://127.0.0.1:5050'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: devApiProxyTarget,
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
