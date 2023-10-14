# base image
FROM node:18-alpine@sha256:617b85a014faf7aabe0661885a245cf3022e39675661d5795ab6748bb2f20f0f AS base
RUN npm i --force -g yarn

# install dependencies
FROM base AS deps
RUN apk --no-cache add g++ gcc make python3

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --link-duplicates

# build production server
FROM base AS builder
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . ./

RUN yarn build

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

ENTRYPOINT [ "/bin/sh", "-c", "yarn mm:up && yarn start" ]