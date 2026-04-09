defmodule OrchestratorWeb.AgentChannelTest do
  @moduledoc """
  `OrchestratorWeb.AgentChannel` 통합 테스트 스켈레톤.

  전체 Phoenix Endpoint + UserSocket 부팅이 필요하므로 `:integration`
  태그로 분리되어 기본 실행에서 제외된다.

      mix test --include integration

  ## 커버 대상
  - join 성공 시 AgentRegistry 등록 확인
  - heartbeat 이벤트가 AgentRegistry.touch를 호출
  - TaskDispatcher → 채널 push("task:dispatch") 라우팅
  - task:update / task:complete → TaskCallback 호출 (Req.Test mock)
  """
  use OrchestratorWeb.ChannelCase, async: false

  @moduletag :integration

  alias OrchestratorWeb.{UserSocket, AgentChannel}

  setup do
    agent_id = "agent-test-#{System.unique_integer([:positive])}"
    {:ok, _, socket} =
      UserSocket
      |> socket("user_socket:#{agent_id}", %{agent_id: agent_id, agent_type: "mac"})
      |> subscribe_and_join(AgentChannel, "agent:#{agent_id}")

    {:ok, socket: socket, agent_id: agent_id}
  end

  @tag :skip
  test "join registers agent in AgentRegistry", %{agent_id: agent_id} do
    assert [_entry] = Orchestrator.AgentRegistry.list_by_type("mac")
    assert Enum.any?(Orchestrator.AgentRegistry.list_all(), &(&1.agent_id == agent_id))
  end

  @tag :skip
  test "heartbeat touches registry", %{socket: socket} do
    ref = push(socket, "heartbeat", %{})
    assert_reply ref, :ok
  end

  @tag :skip
  test "task:update forwards to TaskCallback", %{socket: socket} do
    # Req.Test stub 필요: Req.Test.stub(Orchestrator.TaskCallback, fn conn -> ... end)
    ref = push(socket, "task:update", %{"task_id" => "t-1", "progress" => 0.5})
    assert_reply ref, :ok
  end

  @tag :skip
  test "task:complete forwards to TaskCallback", %{socket: socket} do
    ref = push(socket, "task:complete", %{"task_id" => "t-1", "result" => "ok"})
    assert_reply ref, :ok
  end

  @tag :skip
  test "dispatch_task pushes to client", %{socket: _socket} do
    # TaskDispatcher.dispatch(...) 호출 후 assert_push "task:dispatch", %{...}
  end
end
