# base image
FROM node:18-alpine@sha256:e98b96c93214f1ac4253cc1741aa96933947ca904ba0dc750ba0e33016d18521 AS base

# install dependencies
FROM base AS deps
RUN apk --no-cache add g++ gcc make python3
RUN npm i --force -g yarn

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --link-duplicates

# build production server
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

ENV NODE_ENV=production

RUN --mount=type=secret,id=DATABASE_URI \
    export DATABASE_URI=$(cat /run/secrets/DATABASE_URI) && \
    yarn mm:up
RUN yarn build

# production image
FROM base AS final
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD [ "node", "./dist/index.js" ]