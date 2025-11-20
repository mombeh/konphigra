# ---- BUILDER ----
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json turbo.json ./

# Copy nested workspace package manifests
COPY apps/api/package.json apps/api/
COPY packages/sdk/package.json packages/sdk/
COPY packages/ui/package.json packages/ui/
COPY packages/typescript-config/package.json packages/typescript-config/

# Install dependencies for the whole monorepo
RUN npm install

# Copy everything
COPY . .

# Build only the API
RUN npm run build --workspace=@konphigra/api

# ---- RUNNER ----
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./

RUN npm install --omit=dev

CMD ["node", "dist/main.js"]
