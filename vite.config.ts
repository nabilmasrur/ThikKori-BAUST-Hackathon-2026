import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';

const csvSignupPlugin = (): Plugin => ({
  name: 'csv-signup-plugin',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/api/signup' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const { role, name, phone, profession } = data;
            const csvLine = `"${role}","${name}","${phone}","${profession || ''}"\n`;
            const filePath = path.resolve(__dirname, 'signups.csv');
            
            if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, 'Role,Name,Phone,Profession\n', 'utf8');
            }
            
            fs.appendFileSync(filePath, csvLine, 'utf8');
            
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Failed to write CSV' }));
          }
        });
        return;
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), csvSignupPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
