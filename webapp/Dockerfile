# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && apk add --no-cache git

WORKDIR /app

ARG EXPO_PUBLIC_BACKEND_TRPC_URL
ARG EXPO_PUBLIC_WEBAPP_URL
ARG EXPO_PUBLIC_SENTRYHAWK_DSN=""
ARG EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=""
ARG EXPO_PUBLIC_MIXPANEL_API_KEY=""
ARG EXPO_PUBLIC_MIXPANEL_API_HOST="https://api-js.mixpanel.com"
ARG NODE_ENV="production"

ENV EXPO_PUBLIC_BACKEND_TRPC_URL="${EXPO_PUBLIC_BACKEND_TRPC_URL}"
ENV EXPO_PUBLIC_WEBAPP_URL="${EXPO_PUBLIC_WEBAPP_URL}"
ENV EXPO_PUBLIC_SENTRYHAWK_DSN="${EXPO_PUBLIC_SENTRYHAWK_DSN}"
ENV EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME="${EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}"
ENV EXPO_PUBLIC_MIXPANEL_API_KEY="${EXPO_PUBLIC_MIXPANEL_API_KEY}"
ENV EXPO_PUBLIC_MIXPANEL_API_HOST="${EXPO_PUBLIC_MIXPANEL_API_HOST}"
ENV NODE_ENV="${NODE_ENV}"

COPY .npmrc pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY webapp/package.json ./webapp/package.json
COPY shared/package.json ./shared/package.json
COPY server/package.json ./server/package.json

RUN pnpm install --frozen-lockfile --ignore-scripts --prod=false

COPY shared ./shared
COPY webapp ./webapp
COPY server/src ./server/src

RUN test -n "$EXPO_PUBLIC_BACKEND_TRPC_URL"
RUN test -n "$EXPO_PUBLIC_WEBAPP_URL"
RUN pnpm --filter @somnia/webapp build:web

FROM nginx:1.27-alpine AS runtime

COPY webapp/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/webapp/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
