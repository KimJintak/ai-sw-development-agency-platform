defmodule Orchestrator.CallbackOutbox do
  @moduledoc """
  지속성 콜백 Outbox. TaskCallback이 fire-and-forget으로 잃던 에이전트 이벤트를
  DB에 persisting 한 후 백그라운드 worker가 지수 백오프 + 최대 재시도 횟수
  한도에서 API로 전달한다.

  상태:
    * `"pending"`   — 전송 대기 / 재시도 예정
    * `"delivered"` — API가 2xx 반환
    * `"dead"`      — 최대 재시도 초과. 수동 조사 필요
  """
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query

  alias Orchestrator.Repo

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "callback_outbox" do
    field :path, :string
    field :agent_id, :string
    field :correlation_id, :string
    field :body, :map
    field :status, :string, default: "pending"
    field :attempts, :integer, default: 0
    field :last_error, :string
    field :next_retry_at, :utc_datetime_usec
    field :delivered_at, :utc_datetime_usec

    timestamps(type: :utc_datetime_usec)
  end

  @doc """
  신규 콜백을 등록한다. `:next_retry_at`이 없으면 즉시 전송 대상.
  """
  @spec enqueue(map()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def enqueue(attrs) do
    attrs = Map.put_new(attrs, :next_retry_at, DateTime.utc_now())

    %__MODULE__{}
    |> changeset(attrs)
    |> Repo.insert()
  end

  @doc "delivered 로 마크"
  @spec mark_delivered(t()) :: {:ok, t()} | {:error, Ecto.Changeset.t()}
  def mark_delivered(%__MODULE__{} = row) do
    row
    |> changeset(%{status: "delivered", delivered_at: DateTime.utc_now()})
    |> Repo.update()
  end

  @doc """
  실패로 마크 — attempts++, next_retry_at 으로 연기. 최대 재시도 도달 시
  status=\"dead\" 로 전환.
  """
  @spec mark_failed(t(), String.t(), DateTime.t(), pos_integer()) ::
          {:ok, t()} | {:error, Ecto.Changeset.t()}
  def mark_failed(%__MODULE__{} = row, error, next_retry_at, max_attempts) do
    attempts = row.attempts + 1
    status = if attempts >= max_attempts, do: "dead", else: "pending"

    row
    |> changeset(%{
      attempts: attempts,
      last_error: error,
      status: status,
      next_retry_at: next_retry_at
    })
    |> Repo.update()
  end

  @doc "전송 대기 중이면서 next_retry_at 이 도래한 레코드를 가져온다."
  @spec due(DateTime.t(), pos_integer()) :: [t()]
  def due(now, limit \\ 20) do
    from(c in __MODULE__,
      where: c.status == "pending" and c.next_retry_at <= ^now,
      order_by: [asc: c.next_retry_at],
      limit: ^limit
    )
    |> Repo.all()
  end

  @doc "관찰용: 각 상태 카운트"
  @spec counts() :: %{String.t() => non_neg_integer()}
  def counts do
    from(c in __MODULE__, group_by: c.status, select: {c.status, count(c.id)})
    |> Repo.all()
    |> Map.new()
  end

  defp changeset(row, attrs) do
    row
    |> cast(attrs, [
      :path,
      :agent_id,
      :correlation_id,
      :body,
      :status,
      :attempts,
      :last_error,
      :next_retry_at,
      :delivered_at
    ])
    |> validate_required([:path, :agent_id, :correlation_id, :body, :next_retry_at])
    |> validate_inclusion(:status, ["pending", "delivered", "dead"])
  end
end
