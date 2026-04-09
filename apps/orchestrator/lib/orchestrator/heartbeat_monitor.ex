defmodule Orchestrator.HeartbeatMonitor do
  @moduledoc """
  주기적으로 AgentRegistry를 스캔하여 heartbeat가 오래된 에이전트를 제거한다.

  Options (mainly for tests):
    * `:interval_ms` — tick 주기 (기본 10_000)
    * `:timeout_seconds` — last_seen 이후 offline 판정까지의 초 (기본 30)
    * `:name` — 프로세스 이름 (기본 `__MODULE__`)
  """
  use GenServer
  require Logger

  @default_interval_ms 10_000
  @default_timeout_seconds 30

  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  동기적으로 즉시 한 번 스캔한다. 테스트에서 스케줄러를 기다리지 않고
  청소 동작을 검증할 때 유용하다.
  """
  def sweep(server \\ __MODULE__), do: GenServer.call(server, :sweep)

  @impl true
  def init(opts) do
    state = %{
      interval_ms: Keyword.get(opts, :interval_ms, @default_interval_ms),
      timeout_seconds: Keyword.get(opts, :timeout_seconds, @default_timeout_seconds)
    }

    schedule_tick(state.interval_ms)
    {:ok, state}
  end

  @impl true
  def handle_call(:sweep, _from, state) do
    do_sweep(state.timeout_seconds)
    {:reply, :ok, state}
  end

  @impl true
  def handle_info(:tick, state) do
    do_sweep(state.timeout_seconds)
    schedule_tick(state.interval_ms)
    {:noreply, state}
  end

  defp do_sweep(timeout_seconds) do
    now = System.system_time(:second)

    Orchestrator.AgentRegistry.list_all()
    |> Enum.each(fn {agent_id, %{last_seen: last_seen}} ->
      if now - last_seen > timeout_seconds do
        Logger.warning("Agent #{agent_id} timed out (last_seen=#{last_seen}), unregistering")
        Orchestrator.AgentRegistry.unregister(agent_id)
      end
    end)
  end

  defp schedule_tick(interval_ms),
    do: Process.send_after(self(), :tick, interval_ms)
end
