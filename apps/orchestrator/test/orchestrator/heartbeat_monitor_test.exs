defmodule Orchestrator.HeartbeatMonitorTest do
  @moduledoc """
  Covers FR-04-08 — offline agent detection.

  Uses `sweep/1` to run a single pass synchronously instead of waiting
  for the timer tick.
  """
  use ExUnit.Case, async: false

  alias Orchestrator.{AgentRegistry, HeartbeatMonitor}

  setup do
    start_supervised!(AgentRegistry)

    start_supervised!(
      {HeartbeatMonitor,
       # very long interval so the timer doesn't fire during the test;
       # we invoke sweep/1 manually. timeout_seconds: 1 so a ~2s sleep
       # makes an entry stale but a just-touched entry stays fresh.
       [interval_ms: 60_000, timeout_seconds: 1]}
    )

    :ok
  end

  defp spawn_fake_agent do
    spawn(fn ->
      receive do
        :stop -> :ok
      end
    end)
  end

  test "sweep/1 removes agents whose last_seen exceeds the timeout" do
    AgentRegistry.register("stale", "dev", spawn_fake_agent())
    assert AgentRegistry.lookup("stale") != nil

    # with timeout_seconds: 1, sleeping ~2s makes the entry stale.
    Process.sleep(2_100)

    :ok = HeartbeatMonitor.sweep()
    assert AgentRegistry.lookup("stale") == nil
  end

  test "sweep/1 keeps agents that have been touched recently" do
    AgentRegistry.register("fresh", "dev", spawn_fake_agent())
    Process.sleep(2_100)
    AgentRegistry.touch("fresh")

    :ok = HeartbeatMonitor.sweep()
    assert AgentRegistry.lookup("fresh") != nil
  end

  test "sweep/1 is a no-op when registry is empty" do
    assert :ok = HeartbeatMonitor.sweep()
  end
end
