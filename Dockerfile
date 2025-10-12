# Backend (game-master) Dockerfile at repo root for Cloud Run build
# Builds only hill/game-master subdirectory

FROM node:20-slim AS builder
WORKDIR /app

# Install deps (include dev deps for Prisma generate)
COPY hill/game-master/package*.json ./
RUN npm ci

# Prisma client generate needs schema available
COPY hill/game-master/prisma ./prisma
RUN npx prisma generate

# Copy application source
COPY hill/game-master/. ./

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules and app files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/. ./

EXPOSE 3001
CMD ["node", "server.js"]


