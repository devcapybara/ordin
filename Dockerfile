# --- Stage 1: Build Frontend (React) ---
FROM node:18-alpine as client-builder
WORKDIR /app/client

# Copy package.json client & install dependencies
COPY client/package*.json ./
RUN npm install

# Copy source code client & build
COPY client/ ./
# Build production files to /app/client/dist
RUN npm run build

# --- Stage 2: Setup Backend (Node.js) & Serve App ---
FROM node:18-alpine
WORKDIR /app

# Setup Server Directory
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --production

# Copy Server Source Code
COPY server/ ./

# Copy Built Frontend from Stage 1 to where server expects it
# Server expects ../client/dist relative to itself
COPY --from=client-builder /app/client/dist /app/client/dist

# Expose Port
EXPOSE 5000

# Set Environment to Production
ENV NODE_ENV=production

# Start Server
CMD ["node", "server.js"]
