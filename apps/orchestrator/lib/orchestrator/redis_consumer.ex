defmodule Orchestrator.RedisConsumer do
  @moduledoc """
  Redis Stream `orchestrator:tasks`를 consumer group으로 읽어
  프로젝트 오케스트레이터로 작업을 라우팅한다.

  메시지 포맷 (API가 XADD로 넣는 형태):
    project_id: "proj_..."
    task_id:    "task_..."
    payload:    JSON encoded map
  """
  use GenServer
  require Logger

  @stream "orchestrator:tasks"
  @group "orchestrator"
  @consumer "orchestrator-1"
  @block_ms 5_000
  @count 10

  def start_link(_opts), do: GenServer.start_link(__MODULE__, :ok, name: __MODULE__)

  @impl true
  def init(:ok) do
    send(self(), :ensure_group)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:ensure_group, state) do
    case Redix.command(:redix, ["XGROUP", "CREATE", @stream, @group, "$", "MKSTREAM"]) do
      {:ok, _} ->
        Logger.info("Created Redis consumer group #{@group} on #{@stream}")
      {:error, %Redix.Error{message: "BUSYGROUP" <> _}} ->
        :ok
      {:error, reason} ->
        Logger.warning("XGROUP CREATE failed: #{inspect(reason)}")
    end

    send(self(), :read)
    {:noreply, state}
  end

  def handle_info(:read, state) do
    cmd = [
      "XREADGROUP", "GROUP", @group, @consumer,
      "COUNT", "#{@count}",
      "BLOCK", "#{@block_ms}",
      "STREAMS", @stream, ">"
    ]

    case Redix.command(:redix, cmd) do
      {:ok, nil} -> :ok
      {:ok, [[@stream, entries]]} -> Enum.each(entries, &handle_entry/1)
      {:error, reason} -> Logger.error("XREADGROUP failed: #{inspect(reason)}")
    end

    send(self(), :read)
    {:noreply, state}
  end

  defp handle_entry([entry_id, fields]) do
    map = fields_to_map(fields)

    with %{"project_id" => project_id, "payload" => payload_json} <- map,
         {:ok, payload} <- Jason.decode(payload_json) do
      ensure_project(project_id)
      Orchestrator.ProjectOrchestrator.enqueue_task(project_id, payload)
      Redix.command(:redix, ["XACK", @stream, @group, entry_id])
    else
      other ->
        Logger.warning("Unprocessable stream entry #{entry_id}: #{inspect(other)}")
        Redix.command(:redix, ["XACK", @stream, @group, entry_id])
    end
  end

  defp fields_to_map(fields) do
    fields
    |> Enum.chunk_every(2)
    |> Enum.into(%{}, fn [k, v] -> {k, v} end)
  end

  defp ensure_project(project_id) do
    case Orchestrator.ProjectOrchestrator.whereis(project_id) do
      nil -> Orchestrator.ProjectSupervisor.start_project(project_id)
      _pid -> :ok
    end
  end
end
