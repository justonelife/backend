# ------------------- Base Stage -------------------
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm config set fetch-retry-maxtimeout 600000

# ------------------- Development Stage -------------------
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .

# ------------------- Build Stage -------------------
FROM base AS builder
ENV NODE_ENV=production
RUN npm install --only=production
COPY . .
RUN npm run build

# ------------------- Production Stage -------------------
FROM node:18-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist ./dist
CMD ["node", "dist/main"]
