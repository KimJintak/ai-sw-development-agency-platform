defmodule OrchestratorWeb.AgentChannel do
  @moduledoc """
  에이전트가 WebSocket으로 접속하면 `agent:<agent_id>` 토픽에 조인한다.
  채널 프로세스가 Orchestrator.AgentRegistry에 자기 자신을 등록하고
  TaskDispatcher로부터 `{:dispatch_task, payload}` 메시지를 받아 push한다.
  """
  use Phoenix.Channel
  require Logger

  @impl true
  def join("agent:" <> agent_id, _params, socket) do
    expected_id = socket.assigns[:agent_id]

    if agent_id == expected_id do
      agent_type = socket.assigns[:agent_type]
      Orchestrator.AgentRegistry.register(agent_id, agent_type, self())
      Logger.info("Agent joined: #{agent_id} (#{agent_type})")
      {:ok, socket}
    else
      {:error, %{reason: "agent_id_mismatch"}}
    end
  end

  @impl true
  def handle_in("heartbeat", _payload, socket) do
    Orchestrator.AgentRegistry.touch(socket.assigns.agent_id)
    {:reply, :ok, socket}
  end

  def handle_in("task:update", payload, socket) do
    agent_id = socket.assigns.agent_id
    cid = correlation_id(payload)
    Logger.debug("task update from #{agent_id} task_id=#{payload["task_id"]} cid=#{cid}")
    Orchestrator.TaskCallback.report_update(payload["task_id"], agent_id, payload, cid)
    {:reply, :ok, socket}
  end

  def handle_in("task:complete", payload, socket) do
    agent_id = socket.assigns.agent_id
    cid = correlation_id(payload)
    Logger.info("task complete from #{agent_id} task_id=#{payload["task_id"]} cid=#{cid}")
    Orchestrator.TaskCallback.report_complete(payload["task_id"], agent_id, payload, cid)
    {:reply, :ok, socket}
  end

  defp correlation_id(payload) do
    payload["correlation_id"] || payload["task_id"] || "unknown"
  end

  @impl true
  def handle_info({:dispatch_task, payload}, socket) do
    push(socket, "task:dispatch", payload)
    {:noreply, socket}
  end

  @impl true
  def terminate(_reason, socket) do
    if agent_id = socket.assigns[:agent_id] do
      Orchestrator.AgentRegistry.unregister(agent_id)
    end

    :ok
  end
end
