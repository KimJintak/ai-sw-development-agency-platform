defmodule Orchestrator.MixProject do
  use Mix.Project

  def project do
    [
      app: :orchestrator,
      version: "0.3.0",
      elixir: "~> 1.17",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps()
    ]
  end

  def application do
    [
      mod: {Orchestrator.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      # Phoenix
      {:phoenix, "~> 1.7.14"},
      {:phoenix_pubsub, "~> 2.1"},
      {:plug_cowboy, "~> 2.7"},
      {:jason, "~> 1.4"},

      # Redis
      {:redix, "~> 1.5"},

      # HTTP Client
      {:req, "~> 0.5"},

      # WebSocket Client (에이전트 연결용)
      {:websockex, "~> 0.4.3"},

      # Database (Ecto + Postgrex)
      {:ecto_sql, "~> 3.12"},
      {:postgrex, "~> 0.19"},

      # Dev / Test
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:ex_doc, "~> 0.34", only: :dev, runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup"],
      "ecto.setup": ["ecto.create", "ecto.migrate"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      # Unit tests do not require Postgres. Integration tests that hit
      # the DB should use a dedicated alias that first runs ecto.create/migrate.
      test: ["test"]
    ]
  end
end
