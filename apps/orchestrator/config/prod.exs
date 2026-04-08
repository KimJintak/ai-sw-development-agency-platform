import Config

config :orchestrator, OrchestratorWeb.Endpoint,
  url: [host: System.get_env("PHX_HOST") || "example.com", port: 443, scheme: "https"],
  http: [ip: {0, 0, 0, 0}, port: String.to_integer(System.get_env("PHX_PORT") || "4001")],
  secret_key_base: System.fetch_env!("PHX_SECRET_KEY_BASE")

config :orchestrator, Orchestrator.Repo,
  url: System.fetch_env!("DATABASE_URL"),
  pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
  ssl: true

config :orchestrator, :redis_url, System.fetch_env!("REDIS_URL")
config :orchestrator, :api_url, System.fetch_env!("API_URL")
config :orchestrator, :orchestrator_secret, System.fetch_env!("ORCHESTRATOR_SECRET")

config :logger, level: :info
