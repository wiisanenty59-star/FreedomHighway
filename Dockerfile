FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client/package.json ./lib/api-client/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/urbex/package.json ./artifacts/urbex/
RUN pnpm install --frozen-lockfile

FROM deps AS builder
COPY . .
RUN pnpm --filter @workspace/api-spec run codegen
RUN pnpm --filter @workspace/api-server run build
RUN pnpm --filter @workspace/urbex run build

FROM base AS api
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/artifacts/api-server/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/index.js"]

FROM nginx:alpine AS frontend
COPY --from=builder /app/artifacts/urbex/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
