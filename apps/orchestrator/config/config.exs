import Config

config :orchestrator,
  ecto_repos: [Orchestrator.Repo]

config :orchestrator, OrchestratorWeb.Endpoint,
  url: [host: "localhost"],
  render_errors: [
    formats: [json: OrchestratorWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: Orchestrator.PubSub,
  live_view: [signing_salt: "agency_salt"]

config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

config :phoenix, :json_library, Jason

# API callback defaults — overridden by env-specific configs.
config :orchestrator, :api_url, "http://localhost:4000"
config :orchestrator, :orchestrator_secret, ""

import_config "#{config_env()}.exs"
