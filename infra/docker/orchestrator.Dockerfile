FROM elixir:1.17-alpine AS builder
RUN apk add --no-cache build-base git
WORKDIR /app
ENV MIX_ENV=prod

COPY apps/orchestrator/mix.exs apps/orchestrator/mix.lock ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get --only prod
RUN mix deps.compile

COPY apps/orchestrator .
RUN mix compile
RUN mix release

FROM alpine:3.19 AS runner
RUN apk add --no-cache libstdc++ openssl ncurses-libs
WORKDIR /app
ENV MIX_ENV=prod

COPY --from=builder /app/_build/prod/rel/orchestrator ./
EXPOSE 4001
CMD ["bin/orchestrator", "start"]
