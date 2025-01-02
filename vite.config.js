import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from 'path';

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  // Add the resolve configuration using path
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },

  // Tauri specific configuration
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));