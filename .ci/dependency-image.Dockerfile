# syntax=docker/dockerfile:1.7

ARG LAPIS_CI_IMAGE=ghcr.io/lapismd/lapis-ci@sha256:8fb0ecf5e978c9b44acd8394d78f689d93404f30f8014861a10a7eb2b90b96b8

FROM ${LAPIS_CI_IMAGE} AS fetch
WORKDIR /dependency-context
COPY . .
RUN pnpm fetch --frozen-lockfile

FROM ${LAPIS_CI_IMAGE}
LABEL org.opencontainers.image.title="Lapis Plugins CI dependencies" \
      org.opencontainers.image.description="Lockfile-specific pnpm store for Lapis first-party plugin validation" \
      org.opencontainers.image.source="https://github.com/lapismd/lapis-plugins" \
      org.opencontainers.image.licenses="AGPL-3.0-or-later"
COPY --from=fetch /pnpm/store /pnpm/store
WORKDIR /workspace
