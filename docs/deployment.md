# Развертывание

## Назначение документа

Документ описывает локальный запуск, сборку и контейнеризацию проекта `Универ`.

## Требования окружения

Для локальной разработки требуются:

- Node.js 20 или совместимая версия;
- pnpm;
- PostgreSQL;
- опционально Redis;
- учетная запись Cloudinary для загрузки изображений;
- переменные окружения для server и webapp.

## Установка зависимостей

Зависимости устанавливаются из корня репозитория:

```bash
pnpm install
```

Проект использует `pnpm workspace`, поэтому зависимости устанавливаются для всех пакетов monorepo.

## Переменные окружения сервера

Пример серверных переменных находится в `server/env.example`.

Основные переменные:

| Переменная               | Назначение                                         |
| ------------------------ | -------------------------------------------------- |
| `DATABASE_URL`           | Строка подключения к PostgreSQL.                   |
| `PORT`                   | Порт HTTP-сервера.                                 |
| `JWT_SECRET`             | Секрет для подписи JWT.                            |
| `PASSWORD_SALT`          | Соль для хеширования паролей.                      |
| `ADMIN_NICKNAME`         | Никнейм начального администратора.                 |
| `ADMIN_PASSWORD`         | Пароль начального администратора.                  |
| `ADMIN_EMAIL`            | Email начального администратора.                   |
| `WEBAPP_URL`             | URL клиентского приложения.                        |
| `SERVER_URL`             | URL серверного приложения.                         |
| `CORS_ORIGINS`           | Разрешенные origins для production-среды.          |
| `REDIS_URL`              | URL Redis, если используется кэш.                  |
| `DEBUG`                  | Настройка debug-логов.                             |
| `BACKEND_SENTRYHAWK_DSN` | DSN для серверного Sentry.                         |
| `SOURCE_VERSION`         | Версия исходного кода для мониторинга.             |
| `NODE_ENV`               | Окружение: `development`, `production` или `test`. |
| `CLOUDINARY_API_KEY`     | API key Cloudinary.                                |
| `CLOUDINARY_API_SECRET`  | API secret Cloudinary.                             |
| `CLOUDINARY_CLOUD_NAME`  | Имя Cloudinary cloud.                              |

Важно: пример `server/env.example` должен поддерживаться в актуальном состоянии относительно схемы `server/src/lib/env.ts`.

## Переменные окружения клиента

Пример клиентских переменных находится в `webapp/env.example`.

Основные переменные:

| Переменная                          | Назначение                        |
| ----------------------------------- | --------------------------------- |
| `EXPO_PUBLIC_BACKEND_TRPC_URL`      | URL tRPC API.                     |
| `EXPO_PUBLIC_WEBAPP_URL`            | URL web-версии приложения.        |
| `EXPO_PUBLIC_SENTRYHAWK_DSN`        | DSN для клиентского Sentry.       |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Имя Cloudinary cloud для клиента. |
| `EXPO_PUBLIC_MIXPANEL_API_KEY`      | API key Mixpanel.                 |
| `EXPO_PUBLIC_MIXPANEL_API_HOST`     | API host Mixpanel.                |
| `NODE_ENV`                          | Окружение сборки.                 |

Переменные с префиксом `EXPO_PUBLIC_` попадают в клиентский bundle, поэтому в них нельзя хранить секретные ключи.

## База данных

База данных работает на PostgreSQL. Модель данных описана в Prisma-схеме:

```text
server/src/prisma/schema.prisma
```

Для применения миграций в development-среде используется команда пакета `server`:

```bash
pnpm --filter @somnia/server pmd
```

Для генерации Prisma Client:

```bash
pnpm --filter @somnia/server pgc
```

Для test-окружения предусмотрена команда:

```bash
pnpm --filter @somnia/server pmt
```

В test-окружении сервер проверяет, что имя тестовой базы данных заканчивается на `-test`.

## Локальный запуск сервера

Сервер запускается командой:

```bash
pnpm --filter @somnia/server dev
```

Команда запускает `ts-node-dev`, отслеживает изменения и поднимает Express-сервер.

## Локальный запуск клиента

Клиент запускается командой:

```bash
pnpm --filter @somnia/webapp dev
```

Для web-режима можно использовать:

```bash
pnpm --filter @somnia/webapp web
```

В корневом `package.json` также есть команда:

```bash
pnpm start:webapp:stable
```

Она запускает Expo с дополнительной настройкой для стабильного режима.

## Сборка

Сборка сервера:

```bash
pnpm build:server
```

Сборка web-приложения:

```bash
pnpm --filter @somnia/webapp build:web
```

Сборка всех типов:

```bash
pnpm types
```

Проверка lint:

```bash
pnpm lint
```

## Docker

В проекте есть Dockerfile для сервера и web-приложения.

### Сервер

Сборка:

```bash
pnpm docker:build:server
```

Запуск:

```bash
pnpm docker:run:server
```

Серверный Dockerfile использует multi-stage build, собирает shared и server, генерирует Prisma Client и запускает `node dist/index.js`.

### Webapp

Сборка:

```bash
pnpm docker:build:webapp
```

Запуск:

```bash
pnpm docker:run:webapp
```

Webapp Dockerfile собирает Expo web export и отдает результат через Nginx.

## Production-особенности

Для production-среды необходимо:

- задать надежные значения `JWT_SECRET` и `PASSWORD_SALT`;
- использовать отдельную production-базу PostgreSQL;
- задать `CORS_ORIGINS`;
- настроить Cloudinary;
- настроить Sentry DSN;
- задать корректные URL клиента и сервера;
- не передавать секреты в переменные `EXPO_PUBLIC_*`;
- применять миграции БД перед запуском новой версии.

## Опциональный Redis

Redis подключается только при наличии `REDIS_URL`. Если переменная не задана или подключение недоступно, серверная логика должна продолжать работать, но без кэширования.
