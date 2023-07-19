# base image
FROM node:18-alpine@sha256:d5b2a7869a4016b1847986ea52098fa404421e44281bb7615a9e3615e07f37fb AS base

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
RUN yarn build:prod

# production image
FROM base AS final
WORKDIR /app

COPY --from=builder /app/out ./dist

ENV NODE_ENV=production

CMD [ "node", "./dist/index.js" ]