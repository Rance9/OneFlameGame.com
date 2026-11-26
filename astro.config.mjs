import { defineConfig } from 'astro/config';

// The development server doesn't open public/admin/index.html for /admin/ on its own; GitHub Pages does.
const adminIndex = {
  name: 'admin-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/admin') {
        res.writeHead(301, { Location: '/admin/' });
        res.end();
        return;
      }
      if (req.url === '/admin/') req.url = '/admin/index.html';
      next();
    });
  },
};

export default defineConfig({
  site: 'https://oneflamegame.com',
  output: 'static',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  vite: { plugins: [adminIndex] },
});
