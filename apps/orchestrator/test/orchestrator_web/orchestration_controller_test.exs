defmodule OrchestratorWeb.OrchestrationControllerTest do
  @moduledoc """
  `OrchestratorWeb.OrchestrationController` HTTP 통합 테스트 스켈레톤.

  전체 Endpoint + Router 부팅이 필요하므로 `:integration` 태그로 분리.

      mix test --include integration

  ## 커버 대상
  - POST /api/orchestrate/:id/start → 200 + status=started
  - 중복 start → 200 + status=already_running
  - POST /api/orchestrate/:id/stop → 200 or 404
  - GET /api/orchestrate/:id/status → 200 payload 검증
  - POST /api/agents/register → 202 + canonical_path
  - AuthPlug 없이 호출 시 401
  """
  use OrchestratorWeb.ConnCase, async: false

  @moduletag :integration

  @secret "test-secret"

  defp auth(conn),
    do: Plug.Conn.put_req_header(conn, "authorization", "Bearer #{@secret}")

  @tag :skip
  test "POST /api/orchestrate/:id/start starts project", %{conn: conn} do
    conn = conn |> auth() |> post("/api/orchestrate/p-1/start")
    assert json_response(conn, 200)["status"] in ["started", "already_running"]
  end

  @tag :skip
  test "POST /api/orchestrate/:id/stop returns 404 when not running", %{conn: conn} do
    conn = conn |> auth() |> post("/api/orchestrate/nonexistent/stop")
    assert json_response(conn, 404)["error"] == "not_found"
  end

  @tag :skip
  test "GET /api/orchestrate/:id/status returns snapshot", %{conn: conn} do
    _ = conn |> auth() |> post("/api/orchestrate/p-2/start")
    conn = conn |> auth() |> get("/api/orchestrate/p-2/status")
    body = json_response(conn, 200)
    assert body["project_id"] == "p-2"
    assert Map.has_key?(body, "tasks_in_flight")
  end

  @tag :skip
  test "POST /api/agents/register returns 202 with canonical_path", %{conn: conn} do
    conn = conn |> auth() |> post("/api/agents/register", %{"agent_id" => "a1"})
    body = json_response(conn, 202)
    assert body["canonical_path"] == "/socket/websocket"
  end

  @tag :skip
  test "missing auth header → 401", %{conn: conn} do
    conn = post(conn, "/api/orchestrate/p-1/start")
    assert conn.status == 401
  end
end
