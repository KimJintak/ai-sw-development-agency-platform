defmodule Orchestrator.AgentRegistryTest do
  @moduledoc """
  Covers FR-04-08 (real-time agent status) and FR-05-01 (agent connection bookkeeping).
  Pure OTP — no external deps.
  """
  use ExUnit.Case, async: false

  alias Orchestrator.AgentRegistry

  setup do
    start_supervised!(AgentRegistry)
    :ok
  end

  # helper: spawn a throwaway process to act as an agent channel pid
  defp spawn_fake_agent do
    spawn(fn ->
      receive do
        :stop -> :ok
      end
    end)
  end

  describe "register/3" do
    test "stores agent metadata" do
      pid = spawn_fake_agent()
      assert :ok = AgentRegistry.register("agent-1", "dev", pid)
      assert %{type: "dev", pid: ^pid, last_seen: last_seen} = AgentRegistry.lookup("agent-1")
      assert is_integer(last_seen)
    end

    test "returns nil for unknown agent" do
      assert AgentRegistry.lookup("ghost") == nil
    end
  end

  describe "list_by_type/1" do
    test "returns only agents of the requested type" do
      dev1 = spawn_fake_agent()
      dev2 = spawn_fake_agent()
      qa1 = spawn_fake_agent()

      AgentRegistry.register("dev-1", "dev", dev1)
      AgentRegistry.register("dev-2", "dev", dev2)
      AgentRegistry.register("qa-1", "qa", qa1)

      devs = AgentRegistry.list_by_type("dev")
      assert length(devs) == 2
      assert Enum.all?(devs, fn {_id, meta} -> meta.type == "dev" end)

      assert [{"qa-1", _}] = AgentRegistry.list_by_type("qa")
      assert [] = AgentRegistry.list_by_type("nonexistent")
    end
  end

  describe "unregister/1" do
    test "removes the agent" do
      pid = spawn_fake_agent()
      AgentRegistry.register("agent-x", "dev", pid)
      assert AgentRegistry.lookup("agent-x") != nil

      assert :ok = AgentRegistry.unregister("agent-x")
      assert AgentRegistry.lookup("agent-x") == nil
    end

    test "unregistering unknown agent is a no-op" do
      assert :ok = AgentRegistry.unregister("never-existed")
    end
  end

  describe "touch/1" do
    test "updates last_seen timestamp" do
      pid = spawn_fake_agent()
      AgentRegistry.register("agent-hb", "dev", pid)
      %{last_seen: before} = AgentRegistry.lookup("agent-hb")

      # ensure system clock advances at least 1 second
      Process.sleep(1_100)
      AgentRegistry.touch("agent-hb")

      %{last_seen: later} = AgentRegistry.lookup("agent-hb")
      assert later > before
    end

    test "touch on unknown agent is a no-op" do
      AgentRegistry.touch("ghost")
      assert AgentRegistry.lookup("ghost") == nil
    end
  end

  describe "auto-cleanup on channel crash" do
    test "DOWN message removes the agent" do
      pid = spawn_fake_agent()
      AgentRegistry.register("agent-crash", "dev", pid)
      assert AgentRegistry.lookup("agent-crash") != nil

      # kill the fake agent; registry's monitor should fire
      ref = Process.monitor(pid)
      send(pid, :stop)
      assert_receive {:DOWN, ^ref, :process, ^pid, _}, 500

      # give the registry a moment to process the DOWN message
      # (GenServer.call forces a sync point)
      _ = AgentRegistry.list_all()
      assert AgentRegistry.lookup("agent-crash") == nil
    end
  end

  describe "list_all/0" do
    test "returns the full state map" do
      AgentRegistry.register("a1", "dev", spawn_fake_agent())
      AgentRegistry.register("a2", "qa", spawn_fake_agent())

      all = AgentRegistry.list_all()
      assert is_map(all)
      assert map_size(all) == 2
      assert Map.has_key?(all, "a1")
      assert Map.has_key?(all, "a2")
    end
  end
end
