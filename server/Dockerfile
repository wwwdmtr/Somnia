# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --prod=false

COPY shared ./shared
COPY server ./server

RUN pnpm --filter @somnia/server pgc
RUN pnpm --filter @somnia/shared build
RUN pnpm --filter @somnia/server build
RUN pnpm --filter @somnia/server deploy --legacy /out
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/somnia?schema=public" \
  pnpm --dir /out exec prisma generate --schema ./src/prisma/schema.prisma

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=build /out ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
