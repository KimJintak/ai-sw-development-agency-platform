defmodule Orchestrator.TaskCallback do
  @moduledoc """
  에이전트에서 올라온 `task:update` / `task:complete` 이벤트를 API 서버로
  HTTP POST 콜백으로 전달한다.

  **신뢰성**: 과거의 fire-and-forget 방식을 걷어내고
  `Orchestrator.CallbackOutbox` 에 persist 한 뒤
  `Orchestrator.CallbackOutbox.Worker` 가 지수 백오프 + 최대 재시도로 전달.
  API 일시 장애 시에도 이벤트가 유실되지 않는다.

  ## 설정 키
  - `:api_url` — API 베이스 URL (예: `http://localhost:4000`)
  - `:orchestrator_secret` — `Authorization: Bearer <secret>` 헤더 값

  ## API 엔드포인트 규약
  - `POST {api_url}/internal/tasks/:task_id/updates`
  - `POST {api_url}/internal/tasks/:task_id/complete`
  """
  require Logger

  alias Orchestrator.CallbackOutbox

  @doc """
  에이전트 진행 상황 업데이트를 outbox에 등록한다.
  """
  @spec report_update(String.t() | nil, String.t(), map(), String.t() | nil) :: :ok
  def report_update(task_id, agent_id, payload, correlation_id \\ nil)
  def report_update(nil, agent_id, _payload, _cid), do: log_missing(agent_id, "task:update")

  def report_update(task_id, agent_id, payload, correlation_id) do
    enqueue("/internal/tasks/#{task_id}/updates", agent_id, payload, correlation_id || task_id)
  end

  @doc """
  에이전트 작업 완료를 outbox에 등록한다.
  """
  @spec report_complete(String.t() | nil, String.t(), map(), String.t() | nil) :: :ok
  def report_complete(task_id, agent_id, payload, correlation_id \\ nil)
  def report_complete(nil, agent_id, _payload, _cid), do: log_missing(agent_id, "task:complete")

  def report_complete(task_id, agent_id, payload, correlation_id) do
    enqueue("/internal/tasks/#{task_id}/complete", agent_id, payload, correlation_id || task_id)
  end

  defp log_missing(agent_id, event) do
    Logger.warning("TaskCallback: missing task_id on #{event} from #{agent_id}")
    :ok
  end

  defp enqueue(path, agent_id, payload, correlation_id) do
    body =
      payload
      |> Map.put("agent_id", agent_id)
      |> Map.put("correlation_id", correlation_id)

    case CallbackOutbox.enqueue(%{
           path: path,
           agent_id: agent_id,
           correlation_id: correlation_id,
           body: body,
           next_retry_at: DateTime.utc_now()
         }) do
      {:ok, _row} ->
        CallbackOutbox.Worker.kick()
        Logger.debug("TaskCallback queued path=#{path} cid=#{correlation_id}")

      {:error, changeset} ->
        Logger.error(
          "TaskCallback enqueue failed path=#{path} cid=#{correlation_id} errors=#{inspect(changeset.errors)}"
        )
    end

    :ok
  end
end
