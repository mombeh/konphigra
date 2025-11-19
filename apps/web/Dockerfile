# --------------------------
# 1) Base image for building
# --------------------------
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm install

# Copy everything
COPY . .

# Build the Next.js app
RUN npm run build


# --------------------------
# 2) Production image
# --------------------------
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only required files for production
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev

# Copy the built Next.js output
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Next.js server runs on port 3000
EXPOSE 3000

CMD ["npm", "start"]
