import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localDataPlugin } from './server/localData.js';

export default defineConfig({
  plugins: [react(), localDataPlugin()],
  base: './',
});
