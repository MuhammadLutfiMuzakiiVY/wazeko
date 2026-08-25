# Stage 1: Build & Compile TypeScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY packages/ packages/
COPY tsconfig.json ./

# Install dependencies and compile TypeScript
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for health check
RUN apk add --no-cache curl

# Create non-root app user
RUN addgroup -S wazekogroup && adduser -S wazekouser -G wazekogroup

# Copy compiled files and dependencies
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/packages ./packages

# Setup persistent volumes directories with proper ownership
RUN mkdir -p /app/wazeko-session /app/media-cache && \
    chown -R wazekouser:wazekogroup /app

USER wazekouser

EXPOSE 3000

# Health check against MonitoringServer
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/examples/enterprise-bot.js"]
