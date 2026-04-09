defmodule Orchestrator.TaskCallback do
  @moduledoc """
  에이전트에서 올라온 `task:update` / `task:complete` 이벤트를 API 서버로
  HTTP POST 콜백으로 전달한다.

  채널 프로세스를 블로킹하지 않도록 `Orchestrator.TaskSupervisor` 하위에서
  비동기(fire-and-forget)로 전송한다. 실패 시 로그만 남기며, 재시도는
  Phase 3의 outbox 패턴으로 이관한다.

  ## 설정 키
  - `:api_url` — API 베이스 URL (예: `http://localhost:4000`)
  - `:orchestrator_secret` — `Authorization: Bearer <secret>` 헤더 값

  ## API 엔드포인트 규약 (API 측에서 구현 예정)
  - `POST {api_url}/internal/tasks/:task_id/updates`
  - `POST {api_url}/internal/tasks/:task_id/complete`
  """
  require Logger

  @request_timeout_ms 5_000

  @doc """
  에이전트 진행 상황 업데이트를 비동기로 API에 전달한다.
  """
  @spec report_update(String.t() | nil, String.t(), map()) :: :ok
  def report_update(nil, agent_id, _payload), do: log_missing(agent_id, "task:update")
  def report_update(task_id, agent_id, payload) do
    post_async("/internal/tasks/#{task_id}/updates", agent_id, payload)
  end

  @doc """
  에이전트 작업 완료를 비동기로 API에 전달한다.
  """
  @spec report_complete(String.t() | nil, String.t(), map()) :: :ok
  def report_complete(nil, agent_id, _payload), do: log_missing(agent_id, "task:complete")
  def report_complete(task_id, agent_id, payload) do
    post_async("/internal/tasks/#{task_id}/complete", agent_id, payload)
  end

  defp log_missing(agent_id, event) do
    Logger.warning("TaskCallback: missing task_id on #{event} from #{agent_id}")
    :ok
  end

  defp post_async(path, agent_id, payload) do
    Task.Supervisor.start_child(Orchestrator.TaskSupervisor, fn ->
      do_post(path, agent_id, payload)
    end)

    :ok
  end

  defp do_post(path, agent_id, payload) do
    url = api_url() <> path
    body = Map.put(payload, "agent_id", agent_id)

    headers = [
      {"authorization", "Bearer #{orchestrator_secret()}"},
      {"content-type", "application/json"}
    ]

    case Req.post(url, json: body, headers: headers, receive_timeout: @request_timeout_ms) do
      {:ok, %{status: status}} when status in 200..299 ->
        Logger.debug("TaskCallback OK #{status} #{path} (agent=#{agent_id})")

      {:ok, %{status: status, body: resp_body}} ->
        Logger.warning(
          "TaskCallback non-2xx: #{status} #{path} agent=#{agent_id} body=#{inspect(resp_body)}"
        )

      {:error, reason} ->
        Logger.warning(
          "TaskCallback failed: #{path} agent=#{agent_id} reason=#{inspect(reason)}"
        )
    end
  end

  defp api_url do
    Application.get_env(:orchestrator, :api_url, "http://localhost:4000")
  end

  defp orchestrator_secret do
    Application.get_env(:orchestrator, :orchestrator_secret, "")
  end
end
