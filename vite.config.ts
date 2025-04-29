import path from "path";
import fs from "fs";
import { defineConfig, normalizePath } from "vite";
import react from "@vitejs/plugin-react-swc";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    {
      name: "vite-plugin-binary-data",
      transform(code, id) {
        const [path, query] = id.split("?");
        if (query != "raw-binary") return null;

        const data = fs.readFileSync(path);
        const base64 = data.toString("base64");
        return `export default '${base64}';`;
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
