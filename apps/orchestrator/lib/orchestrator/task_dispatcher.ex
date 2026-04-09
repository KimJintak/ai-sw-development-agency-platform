defmodule Orchestrator.TaskDispatcher do
  @moduledoc """
  작업을 적절한 agent_type의 온라인 에이전트에게 라우팅한다.
  간단한 round-robin 선택기를 사용한다.
  """
  use GenServer
  require Logger

  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)

  @impl true
  def init(:ok), do: {:ok, %{cursor: %{}}}

  @doc """
  작업을 디스패치한다. task 맵은 최소한 "agent_type"을 포함해야 한다.
  """
  def dispatch(project_id, task) do
    GenServer.call(__MODULE__, {:dispatch, project_id, task})
  end

  @impl true
  def handle_call({:dispatch, project_id, task}, _from, state) do
    agent_type = task["agent_type"] || "default"

    case pick_agent(agent_type, state.cursor) do
      {nil, cursor} ->
        Logger.warning("No online agent for type=#{agent_type}, requeuing")
        {:reply, {:error, :no_agent}, %{state | cursor: cursor}}

      {{agent_id, %{pid: pid}}, cursor} ->
        payload = %{
          event: "task:dispatch",
          project_id: project_id,
          task: task
        }

        send(pid, {:dispatch_task, payload})
        Logger.info("Dispatched task=#{task["id"]} to agent=#{agent_id}")
        {:reply, {:ok, agent_id}, %{state | cursor: cursor}}
    end
  end

  defp pick_agent(agent_type, cursor) do
    agents = Orchestrator.AgentRegistry.list_by_type(agent_type)

    case agents do
      [] ->
        {nil, cursor}

      list ->
        idx = Map.get(cursor, agent_type, 0)
        chosen = Enum.at(list, rem(idx, length(list)))
        {chosen, Map.put(cursor, agent_type, idx + 1)}
    end
  end
end
