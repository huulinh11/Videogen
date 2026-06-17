# Single-stage build for Videogen (frontend pre-built by GitHub Actions)
FROM node:20-slim
WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Copy pre-built client dist (must be built before docker build)
COPY client/dist ./client/dist

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "index.js"]
