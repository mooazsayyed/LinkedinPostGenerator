# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.14.0
FROM node:${NODE_VERSION}-alpine AS builder

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies for node-gyp builds
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:${NODE_VERSION}-alpine AS runtime
RUN apk add --no-cache python3

WORKDIR /usr/src/app
COPY --from=builder /app /usr/src/app

USER node
EXPOSE 3000
CMD ["npm", "start"]
