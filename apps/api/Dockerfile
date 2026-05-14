FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS build
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/ apps/api/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm --filter api install --frozen-lockfile
RUN cd apps/api && npx prisma generate
RUN pnpm --filter api build
RUN pnpm --filter api deploy --prod /prod/api

FROM base
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y openssl && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
COPY --from=build /prod/api /app
COPY --from=build /app/apps/api/dist /app/dist
COPY --from=build /app/apps/api/prisma /app/prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma
EXPOSE 8080
CMD ["node", "dist/main"]
