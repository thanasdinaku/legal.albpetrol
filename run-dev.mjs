#!/usr/bin/env node

// Polyfill __dirname for ES modules
globalThis.__dirname = process.cwd();
globalThis.__filename = '';

// Set NODE_ENV
process.env.NODE_ENV = 'development';

// Use dynamic import to load tsx and run the server
import('tsx/esm').then(() => {
  import('./server/index.ts');
});
