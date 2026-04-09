import Config

# Unit tests don't need Repo / Redis / Endpoint. Skip starting them at
# boot so tests run cleanly without Postgres or Redis running locally.
config :orchestrator, :start_runtime_services, false

# Unit tests do not hit Postgres; Repo is still configured in case a
# future integration test needs it.
config :orchestrator, Orchestrator.Repo,
  username: "postgres",
  password: "password",
  hostname: "localhost",
  database: "agency_test_db",
  pool: Ecto.Adapters.SQL.Sandbox,
  pool_size: 5

# Endpoint is not started during unit tests (see test_helper.exs which
# stops :orchestrator before ExUnit.start/0), but we still provide a
# minimal config so that modules referencing it compile cleanly.
config :orchestrator, OrchestratorWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  server: false,
  secret_key_base: "test-secret-key-base-not-for-production-needs-at-least-64-chars!!"

config :orchestrator, :redis_url, "redis://localhost:6379"
config :orchestrator, :orchestrator_secret, "test-secret"

config :logger, level: :warning
