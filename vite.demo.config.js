import { defineConfig } from 'vite';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const rootDir = dirname(fileURLToPath(import.meta.url));

/** GitHub Pages: https://jimole775.github.io/bezier-slider/demo/ */
export const DEMO_BASE = './';

/** 构建 demo 静态站（GitHub Pages 等），会打包 highlight.js 与源码 */
export default defineConfig({
    root: resolve(rootDir, 'demo'),
    base: DEMO_BASE,
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: resolve(rootDir, 'demo/index.dev.html')
        }
    }
});
