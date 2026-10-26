import { defineConfig } from "vite";

// base "./" permite publicar el juego en cualquier carpeta (por ejemplo /khipu-legends/selva/)
export default defineConfig({
  base: "./",
  build: { outDir: "dist", assetsInlineLimit: 0, chunkSizeWarningLimit: 2000 },
});
