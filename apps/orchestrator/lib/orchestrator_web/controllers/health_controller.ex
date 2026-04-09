defmodule OrchestratorWeb.HealthController do
  use Phoenix.Controller, formats: [:json]

  def index(conn, _params) do
    body = %{
      status: "ok",
      app: "orchestrator",
      agents_online: map_size(Orchestrator.AgentRegistry.list_all()),
      projects_running: length(Orchestrator.ProjectSupervisor.list_projects())
    }

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(200, Jason.encode!(body))
  end
end
