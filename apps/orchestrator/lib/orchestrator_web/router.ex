defmodule OrchestratorWeb.Router do
  use Phoenix.Router

  pipeline :api do
    plug :accepts, ["json"]
    plug OrchestratorWeb.Plugs.AuthPlug
  end

  scope "/", OrchestratorWeb do
    get "/health", HealthController, :index
  end

  scope "/api", OrchestratorWeb do
    pipe_through :api

    post "/orchestrate/:project_id/start",  OrchestrationController, :start
    post "/orchestrate/:project_id/stop",   OrchestrationController, :stop
    get  "/orchestrate/:project_id/status", OrchestrationController, :status
    post "/agents/register",                OrchestrationController, :register_agent
  end
end
