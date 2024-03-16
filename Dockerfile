# base image
FROM node:20-alpine@sha256:bf77dc26e48ea95fca9d1aceb5acfa69d2e546b765ec2abfb502975f1a2d4def AS base
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