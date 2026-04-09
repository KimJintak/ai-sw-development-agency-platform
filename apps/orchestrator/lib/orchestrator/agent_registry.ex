defmodule Orchestrator.AgentRegistry do
  @moduledoc """
  온라인 에이전트를 agent_type 별로 추적한다.
  채널 프로세스가 연결되면 `register/3`, 끊기면 `unregister/1`.
  """
  use GenServer

  # Client API

  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc "에이전트를 등록한다. pid는 채널 프로세스."
  def register(agent_id, agent_type, pid) do
    GenServer.call(__MODULE__, {:register, agent_id, agent_type, pid})
  end

  def unregister(agent_id) do
    GenServer.call(__MODULE__, {:unregister, agent_id})
  end

  @doc "특정 타입의 온라인 에이전트 리스트 반환."
  def list_by_type(agent_type) do
    GenServer.call(__MODULE__, {:list_by_type, agent_type})
  end

  def list_all do
    GenServer.call(__MODULE__, :list_all)
  end

  def lookup(agent_id) do
    GenServer.call(__MODULE__, {:lookup, agent_id})
  end

  @doc "마지막 heartbeat 시각 업데이트."
  def touch(agent_id) do
    GenServer.cast(__MODULE__, {:touch, agent_id})
  end

  # Server

  @impl true
  def init(_) do
    # state: %{agent_id => %{type: .., pid: .., ref: .., last_seen: ..}}
    {:ok, %{}}
  end

  @impl true
  def handle_call({:register, agent_id, agent_type, pid}, _from, state) do
    ref = Process.monitor(pid)
    entry = %{type: agent_type, pid: pid, ref: ref, last_seen: System.system_time(:second)}
    {:reply, :ok, Map.put(state, agent_id, entry)}
  end

  def handle_call({:unregister, agent_id}, _from, state) do
    case Map.pop(state, agent_id) do
      {nil, state} -> {:reply, :ok, state}
      {%{ref: ref}, state} ->
        Process.demonitor(ref, [:flush])
        {:reply, :ok, state}
    end
  end

  def handle_call({:list_by_type, agent_type}, _from, state) do
    result =
      state
      |> Enum.filter(fn {_id, %{type: t}} -> t == agent_type end)
      |> Enum.map(fn {id, meta} -> {id, meta} end)

    {:reply, result, state}
  end

  def handle_call(:list_all, _from, state), do: {:reply, state, state}

  def handle_call({:lookup, agent_id}, _from, state) do
    {:reply, Map.get(state, agent_id), state}
  end

  @impl true
  def handle_cast({:touch, agent_id}, state) do
    case Map.get(state, agent_id) do
      nil -> {:noreply, state}
      meta ->
        updated = %{meta | last_seen: System.system_time(:second)}
        {:noreply, Map.put(state, agent_id, updated)}
    end
  end

  @impl true
  def handle_info({:DOWN, _ref, :process, pid, _reason}, state) do
    state =
      state
      |> Enum.reject(fn {_id, %{pid: p}} -> p == pid end)
      |> Map.new()

    {:noreply, state}
  end
end
