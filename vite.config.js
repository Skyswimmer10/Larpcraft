import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { localDataPlugin } from './server/localData.js';

export default defineConfig({
  plugins: [react(), localDataPlugin()],
  // Saved data and generated QA/artifacts are not source modules. On Windows,
  // watching them during atomic writes can raise EBUSY and stop the dev server.
  server: { watch: { ignored: ['**/.larpcraft/**', '**/tmp/**', '**/output/**'] } },
  base: './',
});
