# Multi-stage build for Videogen
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ ./
COPY --from=client-builder /app/client/dist /app/client/dist

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "index.js"]
