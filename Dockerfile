FROM node:lts-slim AS base

ARG commit_sha="develop"

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Public env - default values
ENV DATABASE_URL="file:local.db"
ENV PUBLIC_GIT_REPO_ID="sachahjkl/albumator"
ENV PUBLIC_COMMIT_HASH="${commit_sha}"

RUN corepack enable

COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run build

FROM base

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/build /app/build

EXPOSE 3000
CMD [ "node", "build"]