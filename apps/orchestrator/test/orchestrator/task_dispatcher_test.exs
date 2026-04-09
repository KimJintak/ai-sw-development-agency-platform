defmodule Orchestrator.TaskDispatcherTest do
  @moduledoc """
  Covers FR-04-01 (agent routing) happy path and no-agent fallback.
  """
  use ExUnit.Case, async: false

  alias Orchestrator.{AgentRegistry, TaskDispatcher}

  setup do
    start_supervised!(AgentRegistry)
    start_supervised!(TaskDispatcher)
    :ok
  end

  # a "channel" that forwards received messages to the test process
  defp spawn_mailbox(test_pid) do
    spawn(fn -> loop(test_pid) end)
  end

  defp loop(test_pid) do
    receive do
      :stop -> :ok
      msg ->
        send(test_pid, {:got, self(), msg})
        loop(test_pid)
    end
  end

  test "dispatches to the only available agent of the requested type" do
    me = self()
    pid = spawn_mailbox(me)
    AgentRegistry.register("dev-1", "dev", pid)

    task = %{"id" => "t-1", "agent_type" => "dev", "payload" => "work"}
    assert {:ok, "dev-1"} = TaskDispatcher.dispatch("proj-1", task)

    assert_receive {:got, ^pid, {:dispatch_task, payload}}, 500
    assert payload.event == "task:dispatch"
    assert payload.project_id == "proj-1"
    assert payload.task == task
  end

  test "returns :no_agent when no agents are registered for the type" do
    task = %{"id" => "t-orphan", "agent_type" => "builder"}
    assert {:error, :no_agent} = TaskDispatcher.dispatch("proj-1", task)
  end

  test "round-robins across multiple agents of the same type" do
    me = self()
    a = spawn_mailbox(me)
    b = spawn_mailbox(me)
    c = spawn_mailbox(me)

    AgentRegistry.register("a", "dev", a)
    AgentRegistry.register("b", "dev", b)
    AgentRegistry.register("c", "dev", c)

    chosen =
      for i <- 1..6 do
        task = %{"id" => "t-#{i}", "agent_type" => "dev"}
        {:ok, id} = TaskDispatcher.dispatch("proj-rr", task)
        id
      end

    # With 3 agents and 6 dispatches, each should be picked exactly twice.
    frequencies = Enum.frequencies(chosen)
    assert map_size(frequencies) == 3
    assert Enum.all?(frequencies, fn {_id, count} -> count == 2 end)
  end

  test "defaults to agent_type 'default' when field is missing" do
    me = self()
    pid = spawn_mailbox(me)
    AgentRegistry.register("fallback", "default", pid)

    task = %{"id" => "t-default"}
    assert {:ok, "fallback"} = TaskDispatcher.dispatch("proj-1", task)
  end
end
