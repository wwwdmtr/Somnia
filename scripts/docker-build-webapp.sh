#!/usr/bin/env sh
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load local webapp env files, if present.
# Order matters: .env.local should override .env values.
set -a
[ -f "$ROOT_DIR/webapp/.env" ] && . "$ROOT_DIR/webapp/.env"
[ -f "$ROOT_DIR/webapp/.env.local" ] && . "$ROOT_DIR/webapp/.env.local"
set +a

EXPO_PUBLIC_BACKEND_TRPC_URL="${EXPO_PUBLIC_BACKEND_TRPC_URL:-http://localhost:3000/trpc}"
EXPO_PUBLIC_WEBAPP_URL="${EXPO_PUBLIC_WEBAPP_URL:-http://localhost:8081}"
EXPO_PUBLIC_SENTRYHAWK_DSN="${EXPO_PUBLIC_SENTRYHAWK_DSN:-}"
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME="${EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME:-}"
EXPO_PUBLIC_MIXPANEL_API_KEY="${EXPO_PUBLIC_MIXPANEL_API_KEY:-}"
EXPO_PUBLIC_MIXPANEL_API_HOST="${EXPO_PUBLIC_MIXPANEL_API_HOST:-https://api-js.mixpanel.com}"
NODE_ENV="${NODE_ENV:-production}"

if [ -z "$EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME" ]; then
  echo "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME is required (set it in webapp/.env or shell env)."
  exit 1
fi

docker build \
  -f "$ROOT_DIR/webapp/Dockerfile" \
  -t somnia-webapp:local \
  --build-arg "EXPO_PUBLIC_BACKEND_TRPC_URL=$EXPO_PUBLIC_BACKEND_TRPC_URL" \
  --build-arg "EXPO_PUBLIC_WEBAPP_URL=$EXPO_PUBLIC_WEBAPP_URL" \
  --build-arg "EXPO_PUBLIC_SENTRYHAWK_DSN=$EXPO_PUBLIC_SENTRYHAWK_DSN" \
  --build-arg "EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=$EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME" \
  --build-arg "EXPO_PUBLIC_MIXPANEL_API_KEY=$EXPO_PUBLIC_MIXPANEL_API_KEY" \
  --build-arg "EXPO_PUBLIC_MIXPANEL_API_HOST=$EXPO_PUBLIC_MIXPANEL_API_HOST" \
  --build-arg "NODE_ENV=$NODE_ENV" \
  "$ROOT_DIR"
