# Single-container build: bundles SDK packages, dashboard static files,
# and the Express server. SQLite lives on a mounted volume.
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN pnpm install --frozen-lockfile=false
RUN pnpm build
# Place the built dashboard where the server serves it from in production.
RUN mkdir -p apps/server/public && cp -r apps/dashboard/dist/* apps/server/public/

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
RUN corepack enable
ENV NODE_ENV=production
COPY --from=build /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=build /app/packages ./packages
COPY --from=build /app/apps/server ./apps/server
RUN pnpm install --prod --frozen-lockfile=false
WORKDIR /app/apps/server
VOLUME /data
ENV DATABASE_PATH=/data/reloop.db
EXPOSE 8787
CMD ["node", "dist/index.js"]
