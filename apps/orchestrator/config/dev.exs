import Config

config :orchestrator, Orchestrator.Repo,
  username: "postgres",
  password: "password",
  hostname: "localhost",
  database: "agency_db",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :orchestrator, OrchestratorWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4001],
  check_origin: false,
  secret_key_base: "local-dev-secret-key-base-change-in-production-needs-64-chars!!",
  debug_errors: true

config :orchestrator, :redis_url, "redis://localhost:6379"
config :orchestrator, :api_url, "http://localhost:4000"
config :orchestrator, :orchestrator_secret, "local-dev-orchestrator-secret"

config :logger, level: :debug
