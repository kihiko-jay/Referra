import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        // Consume the shared package's TS source directly so web dev/build do
        // not require the package to be prebuilt.
        '@referraios/shared': path.resolve(
          __dirname,
          '../../packages/shared/src/index.ts',
        ),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
