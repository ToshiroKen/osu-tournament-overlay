import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
    // Change this if you have different path for tosu
    base: 'dist',
    plugins: [],
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
            },
        },
    },
    css: {
        devSourcemap: true,
    }
});
