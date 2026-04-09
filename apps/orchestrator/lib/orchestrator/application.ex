defmodule Orchestrator.Application do
  use Application

  @impl true
  def start(_type, _args) do
    children = core_children() ++ runtime_children()

    opts = [strategy: :one_for_one, name: Orchestrator.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    OrchestratorWeb.Endpoint.config_change(changed, removed)
    :ok
  end

  # Processes that tests need to exercise directly — kept cheap and
  # free of external I/O so tests can start them via `start_supervised!`
  # without hitting Postgres/Redis/Phoenix.
  defp core_children do
    [
      # Phoenix PubSub
      {Phoenix.PubSub, name: Orchestrator.PubSub},

      # Task supervisor for fire-and-forget HTTP callbacks to API
      {Task.Supervisor, name: Orchestrator.TaskSupervisor},

      # Agent registry (tracks online agents by type)
      Orchestrator.AgentRegistry,

      # Project registry (via-tuple lookup for ProjectOrchestrator processes)
      {Registry, keys: :unique, name: Orchestrator.ProjectRegistry},

      # Per-project orchestrator supervisor
      Orchestrator.ProjectSupervisor,

      # Task dispatcher (routes tasks to agents)
      Orchestrator.TaskDispatcher,

      # Heartbeat monitor (detects offline agents)
      Orchestrator.HeartbeatMonitor
    ]
  end

  # Processes with external dependencies (DB / Redis / HTTP endpoint).
  # Tests opt out by setting `config :orchestrator, :start_runtime_services, false`
  # in `config/test.exs`, so unit tests don't spam connection errors.
  defp runtime_children do
    if Application.get_env(:orchestrator, :start_runtime_services, true) do
      [
        Orchestrator.Repo,
        {Redix,
         {Application.get_env(:orchestrator, :redis_url, "redis://localhost:6379"),
          [name: :redix]}},
        Orchestrator.RedisConsumer,
        OrchestratorWeb.Endpoint
      ]
    else
      []
    end
  end
end
