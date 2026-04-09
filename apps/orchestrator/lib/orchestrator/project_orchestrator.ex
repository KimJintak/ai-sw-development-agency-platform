defmodule Orchestrator.ProjectOrchestrator do
  @moduledoc """
  단일 프로젝트의 오케스트레이션 상태를 관리하는 GenServer.
  각 프로젝트는 자기만의 프로세스를 갖는다 (장애 격리).
  """
  use GenServer

  # Client

  def start_link(project_id) do
    GenServer.start_link(__MODULE__, project_id, name: via(project_id))
  end

  def whereis(project_id) do
    case Registry.lookup(Orchestrator.ProjectRegistry, project_id) do
      [{pid, _}] -> pid
      [] -> nil
    end
  end

  def status(project_id) do
    GenServer.call(via(project_id), :status)
  end

  def enqueue_task(project_id, task) do
    GenServer.cast(via(project_id), {:enqueue, task})
  end

  defp via(project_id),
    do: {:via, Registry, {Orchestrator.ProjectRegistry, project_id}}

  # Server

  @impl true
  def init(project_id) do
    state = %{
      project_id: project_id,
      started_at: System.system_time(:second),
      tasks_in_flight: %{},
      tasks_completed: 0
    }

    {:ok, state}
  end

  @impl true
  def handle_call(:status, _from, state), do: {:reply, state, state}

  @impl true
  def handle_cast({:enqueue, task}, state) do
    Orchestrator.TaskDispatcher.dispatch(state.project_id, task)
    in_flight = Map.put(state.tasks_in_flight, task["id"], task)
    {:noreply, %{state | tasks_in_flight: in_flight}}
  end
end
