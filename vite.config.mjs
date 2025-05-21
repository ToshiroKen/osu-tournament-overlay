import { defineConfig, loadEnv } from 'vite';
import { resolve } from "path";


export default defineConfig(({ mode }) => {
    // Change this if you have different path for tosu
    const env = loadEnv(mode, process.cwd());

    return {
        base: env.VITE_APP_BASE_URL,
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
    }
});
