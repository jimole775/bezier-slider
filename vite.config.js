import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [vue(), react()],
  // dev 时以 demo/ 为站点根，访问 http://localhost:5173/ 即可打开演示页
  root: command === 'serve' ? 'demo' : process.cwd(),
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        'bezier-slider': './src/index.js',
        'bezier-slider.vue': './src/vue-component.js',
        'bezier-slider.react': './src/react-component.js'
      },
      name: 'BezierSlider',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', 'react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          vue: 'Vue',
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime'
        }
      }
    }
  }
}));
