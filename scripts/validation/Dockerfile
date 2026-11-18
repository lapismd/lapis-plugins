FROM ghcr.io/lapismd/lapis-ci@sha256:91341a81cc9306eed818c4c433cd29ed11d2ea64c703f32685391befe0eca503 AS ui
ENV PNPM_HOME=/opt/pnpm PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PATH=/opt/tools:/opt/pnpm:$PATH
RUN if command -v deno >/dev/null 2>&1; then echo "Unexpected Deno runtime in portable validation image" >&2; exit 1; fi
RUN test "$(playwright --version)" = 'Version 1.61.1' && playwright install --with-deps chromium webkit
RUN apt-get update && apt-get install -y --no-install-recommends git python3 curl ca-certificates lsof && rm -rf /var/lib/apt/lists/*
COPY install-tools.mjs /opt/install-tools.mjs
RUN node /opt/install-tools.mjs
RUN git config --system user.name 'LapisMD validation' && git config --system user.email 'validation@localhost' && git config --system --add safe.directory '*'
RUN mkdir -p /input /results /work/lapis-plugins
WORKDIR /work/lapis-plugins
