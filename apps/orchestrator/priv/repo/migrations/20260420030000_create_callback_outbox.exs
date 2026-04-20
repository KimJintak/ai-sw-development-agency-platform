defmodule Orchestrator.Repo.Migrations.CreateCallbackOutbox do
  use Ecto.Migration

  def change do
    create table(:callback_outbox, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :path, :string, null: false
      add :agent_id, :string, null: false
      add :correlation_id, :string, null: false
      add :body, :map, null: false
      add :status, :string, null: false, default: "pending"
      add :attempts, :integer, null: false, default: 0
      add :last_error, :text
      add :next_retry_at, :utc_datetime_usec, null: false
      add :delivered_at, :utc_datetime_usec

      timestamps(type: :utc_datetime_usec)
    end

    create index(:callback_outbox, [:status, :next_retry_at])
    create index(:callback_outbox, [:correlation_id])
  end
end
