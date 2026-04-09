defmodule Orchestrator.ProjectSupervisor do
  @moduledoc """
  프로젝트별 ProjectOrchestrator를 동적으로 기동하는 DynamicSupervisor.
  """
  use DynamicSupervisor

  def start_link(_opts) do
    DynamicSupervisor.start_link(__MODULE__, :ok, name: __MODULE__)
  end

  @impl true
  def init(:ok) do
    DynamicSupervisor.init(strategy: :one_for_one)
  end

  def start_project(project_id) do
    spec = {Orchestrator.ProjectOrchestrator, project_id}
    DynamicSupervisor.start_child(__MODULE__, spec)
  end

  def stop_project(project_id) do
    case Orchestrator.ProjectOrchestrator.whereis(project_id) do
      nil -> {:error, :not_found}
      pid -> DynamicSupervisor.terminate_child(__MODULE__, pid)
    end
  end

  def list_projects do
    DynamicSupervisor.which_children(__MODULE__)
  end
end
