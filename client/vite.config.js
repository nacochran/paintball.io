import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    // Specify the output directory for production build
    outDir: path.resolve(__dirname, 'dist/public'),  // adjust path to match your back-end structure
    rollupOptions: {
      input: path.resolve(__dirname, 'src/main.js'),  // the entry point for the bundling
    },
    manifest: true,  // Enable manifest generation
  },
  server: {
    // Ensure VITE is running on the desired port during dev
    port: 3000,
    cors: {
      origin: "http://localhost:3000",
      credentials: true
    }
  }
});
