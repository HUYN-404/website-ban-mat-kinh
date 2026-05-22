import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Frontend dùng port 5174 để tránh conflict với Dashboard
    host: true,
  },
  assetsInclude: ['**/*.avif'], // Đảm bảo Vite xử lý file AVIF
})


