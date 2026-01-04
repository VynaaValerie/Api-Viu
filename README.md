# Viu API

## Overview
A simple Viu API built with Node.js, Express, and EJS. It provides access to Viu data and streaming metadata.

## Project Structure
```
├── index.js          # Main server file with API routes
├── views/            # EJS templates
│   ├── index.ejs     # Documentation page
│   ├── test.ejs      # API playground
│   └── 404.ejs       # 404 error page
├── public/           # Static assets
│   └── style.css     # Stylesheets
├── package.json      # Node.js dependencies
└── vercel.json       # Vercel deployment config (original)
```

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Templating**: EJS
- **HTTP Client**: Axios
- **Utils**: UUID

## API Endpoints
- `GET /` - Documentation page
- `GET /test` - API playground
- `GET /api/home` - Get home data
- `GET /api/search` - Search videos
- `GET /api/detail/:id` - Get product details
- `GET /api/stream/:ccsProductId` - Get stream metadata

## Running the Application
The server runs on port 5000 and binds to `0.0.0.0`.

```bash
npm start
```

## Recent Changes
- 2026-01-04: Converted from Mobinime API to Viu API
