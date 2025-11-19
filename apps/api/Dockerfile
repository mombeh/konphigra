# ---- BUILD STAGE ----
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build NestJS
RUN npm run build

# ---- PRODUCTION STAGE ----
FROM node:18-alpine
WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built code
COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["node", "dist/main.js"]
