# ---- BUILDER ----
FROM node:18-alpine AS builder
WORKDIR /app

# Copy entire repo first
COPY . .

# Install dependencies with workspaces present
RUN npm install

# Build API workspace
RUN npm run build 

# ---- RUNNER ----
FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm install --omit=dev

CMD ["node", "dist/main.js"]
