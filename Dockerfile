# base image
FROM node:18-alpine@sha256:cdc1e8ad656b2ed0873f7af37695fd931b6e3df9cd8ce21edb8f07bdb14c6a41 AS base

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