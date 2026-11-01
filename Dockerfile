# Multi-stage lightweight Dockerfile for Eventiq
FROM node:20-alpine AS base

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source and assets
COPY src/ ./src/
COPY public/ ./public/
COPY .env.example ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run with non-root node user
USER node

CMD ["node", "src/server.js"]
