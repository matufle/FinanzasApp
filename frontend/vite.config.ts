import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 5173 es el origen que la Api acepta en CORS. La variable PORT permite
    // levantar una segunda instancia sin pisar a la primera.
    port: Number(process.env.PORT) || 5173,
  },
})
