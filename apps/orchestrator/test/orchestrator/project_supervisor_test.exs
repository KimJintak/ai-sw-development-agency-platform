defmodule Orchestrator.ProjectSupervisorTest do
  @moduledoc """
  Covers FR-04-09 (per-project isolation): each project gets its own
  supervised GenServer, and crashes in one must not affect another.
  """
  use ExUnit.Case, async: false

  alias Orchestrator.{AgentRegistry, ProjectOrchestrator, ProjectSupervisor, TaskDispatcher}

  setup do
    start_supervised!(AgentRegistry)
    start_supervised!({Registry, keys: :unique, name: Orchestrator.ProjectRegistry})
    start_supervised!(ProjectSupervisor)
    start_supervised!(TaskDispatcher)
    :ok
  end

  describe "start_project/1" do
    test "starts a ProjectOrchestrator and makes it locatable" do
      assert ProjectOrchestrator.whereis("proj-a") == nil

      assert {:ok, pid} = ProjectSupervisor.start_project("proj-a")
      assert is_pid(pid)
      assert ProjectOrchestrator.whereis("proj-a") == pid
    end

    test "rejects duplicate starts for the same project_id" do
      assert {:ok, _pid} = ProjectSupervisor.start_project("proj-dup")
      assert {:error, {:already_started, _pid}} = ProjectSupervisor.start_project("proj-dup")
    end

    test "independently runs multiple projects" do
      {:ok, pid_a} = ProjectSupervisor.start_project("proj-1")
      {:ok, pid_b} = ProjectSupervisor.start_project("proj-2")

      assert pid_a != pid_b
      assert length(ProjectSupervisor.list_projects()) == 2
    end
  end

  describe "stop_project/1" do
    test "terminates the project orchestrator" do
      {:ok, _} = ProjectSupervisor.start_project("proj-stop")
      assert :ok = ProjectSupervisor.stop_project("proj-stop")
      assert ProjectOrchestrator.whereis("proj-stop") == nil
    end

    test "returns :not_found for unknown projects" do
      assert {:error, :not_found} = ProjectSupervisor.stop_project("never-started")
    end
  end

  describe "status/1" do
    test "returns project state" do
      {:ok, _} = ProjectSupervisor.start_project("proj-status")
      state = ProjectOrchestrator.status("proj-status")

      assert state.project_id == "proj-status"
      assert state.tasks_completed == 0
      assert state.tasks_in_flight == %{}
      assert is_integer(state.started_at)
    end
  end

  describe "failure isolation" do
    test "killing one project does not bring down the other" do
      {:ok, pid_a} = ProjectSupervisor.start_project("iso-a")
      {:ok, pid_b} = ProjectSupervisor.start_project("iso-b")

      Process.exit(pid_a, :kill)

      # give the supervisor a moment
      Process.sleep(50)

      assert Process.alive?(pid_b)
      assert ProjectOrchestrator.whereis("iso-b") == pid_b
    end
  end
end
