# base image
FROM node:20-alpine@sha256:b1789b7be6aa16afd642eaaaccdeeeb33bd8f08e69b3d27d931aa9665b731f01 AS base
RUN npm i -g pnpm

# install dependencies
FROM base AS deps
RUN apk --no-cache add g++ gcc make python3

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# build production server
FROM base AS builder
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

RUN pnpm run build

# production image
FROM base AS final
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/files ./files

COPY package.json ./
COPY migrate-mongo-config.js ./
COPY migrations ./migrations

ENTRYPOINT [ "/bin/sh", "-c", "pnpm run mm:up && pnpm run start" ]