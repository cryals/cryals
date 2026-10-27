import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const mediaFolder = fileURLToPath(new URL('./public/image/', import.meta.url));
const mediaScript = fileURLToPath(new URL('./scripts/generate-media-manifest.mjs', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), {
    name: 'refresh-image-manifest',
    configureServer(server) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      server.watcher.add(mediaFolder);
      const update = (path: string) => {
        if (!path.startsWith(mediaFolder)) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          execFile(process.execPath, [mediaScript], (error) => {
            if (error) server.config.logger.error(`Could not refresh image manifest: ${error.message}`);
          });
        }, 100);
      };
      server.watcher.on('add', update);
      server.watcher.on('unlink', update);
    },
  }],
  server: {
    host: true,
  },
});
