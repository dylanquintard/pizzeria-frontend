# Pizzeria front

## Local env
Copy `.env.example` to `.env`.

```bash
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Deploy on Render (Static Site)
This repository includes `render.yaml`.

Set these Render environment variables:

```bash
REACT_APP_API_BASE_URL=https://<your-backend>.onrender.com/api
REACT_APP_SOCKET_URL=https://<your-backend>.onrender.com
```

Build command:

```bash
npm install && npm run build
```

Publish directory:

```bash
build
```
