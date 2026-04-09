defmodule OrchestratorWeb.OrchestrationController do
  use Phoenix.Controller, formats: [:json]

  def start(conn, %{"project_id" => project_id}) do
    case Orchestrator.ProjectSupervisor.start_project(project_id) do
      {:ok, _pid} -> json_resp(conn, 200, %{status: "started", project_id: project_id})
      {:error, {:already_started, _pid}} ->
        json_resp(conn, 200, %{status: "already_running", project_id: project_id})
      {:error, reason} ->
        json_resp(conn, 500, %{error: inspect(reason)})
    end
  end

  def stop(conn, %{"project_id" => project_id}) do
    case Orchestrator.ProjectSupervisor.stop_project(project_id) do
      :ok -> json_resp(conn, 200, %{status: "stopped", project_id: project_id})
      {:error, :not_found} -> json_resp(conn, 404, %{error: "not_found"})
      {:error, reason} -> json_resp(conn, 500, %{error: inspect(reason)})
    end
  end

  def status(conn, %{"project_id" => project_id}) do
    case Orchestrator.ProjectOrchestrator.whereis(project_id) do
      nil ->
        json_resp(conn, 404, %{error: "not_running"})
      _pid ->
        state = Orchestrator.ProjectOrchestrator.status(project_id)
        json_resp(conn, 200, %{
          project_id: project_id,
          started_at: state.started_at,
          tasks_in_flight: map_size(state.tasks_in_flight),
          tasks_completed: state.tasks_completed
        })
    end
  end

  @doc """
  에이전트 사전-등록 엔드포인트 (placeholder).

  실제 에이전트 등록/수명주기는 WebSocket join 경로
  (`OrchestratorWeb.UserSocket` → `OrchestratorWeb.AgentChannel`)에서
  수행된다. 이 HTTP 엔드포인트는 향후 메타데이터 사전등록 / 헬스체크를
  위해 예약되어 있으며, 현재는 202 Accepted로 응답하고 canonical 경로를
  알려준다.
  """
  def register_agent(conn, params) do
    json_resp(conn, 202, %{
      status: "acknowledged",
      canonical_path: "/socket/websocket",
      note: "agents must register via WebSocket join; HTTP is a placeholder",
      params: params
    })
  end

  defp json_resp(conn, code, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(code, Jason.encode!(body))
  end
end
