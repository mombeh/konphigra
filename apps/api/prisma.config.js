const path = require('path');

// Load .env.local manually
require('dotenv').config({
  path: path.resolve(__dirname, '.env.local'),
});

const { defineConfig, env } = require('@prisma/config');

module.exports = defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
});
