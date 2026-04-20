defmodule Orchestrator.CallbackOutbox.Worker do
  @moduledoc """
  CallbackOutbox 레코드를 주기적으로 조회해 API로 전송.
  성공 시 `delivered`, 실패 시 지수 백오프로 `next_retry_at` 연기.
  최대 재시도 초과 시 `dead` 로 전환 — 수동 조사 필요.

  외부에서 `kick/0` 으로 즉시 플러시 요청 가능.
  """
  use GenServer
  require Logger

  alias Orchestrator.CallbackOutbox

  @max_attempts 8
  @request_timeout_ms 5_000
  @tick_interval_ms 10_000
  @initial_delay_ms 3_000

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc "새로 enqueue 된 콜백이 있을 때 지금 즉시 처리 루프를 돌려달라고 알림."
  def kick do
    if Process.whereis(__MODULE__), do: send(__MODULE__, :tick)
    :ok
  end

  @impl true
  def init(_opts) do
    schedule_tick(@initial_delay_ms)
    {:ok, %{}}
  end

  @impl true
  def handle_info(:tick, state) do
    safely_run_due()
    schedule_tick(@tick_interval_ms)
    {:noreply, state}
  end

  defp safely_run_due do
    try do
      run_due()
    rescue
      e ->
        Logger.error("CallbackOutbox.Worker crashed: #{Exception.message(e)}")
    end
  end

  defp run_due do
    CallbackOutbox.due(DateTime.utc_now())
    |> Enum.each(&deliver/1)
  end

  defp deliver(row) do
    url = api_url() <> row.path

    headers = [
      {"authorization", "Bearer #{orchestrator_secret()}"},
      {"content-type", "application/json"},
      {"x-correlation-id", row.correlation_id}
    ]

    case Req.post(url, json: row.body, headers: headers, receive_timeout: @request_timeout_ms) do
      {:ok, %{status: status}} when status in 200..299 ->
        Logger.debug(
          "CallbackOutbox delivered status=#{status} path=#{row.path} cid=#{row.correlation_id}"
        )

        CallbackOutbox.mark_delivered(row)

      {:ok, %{status: status, body: body}} ->
        backoff_retry(row, "non-2xx #{status}: #{inspect(body)}")

      {:error, reason} ->
        backoff_retry(row, "http-error: #{inspect(reason)}")
    end
  end

  defp backoff_retry(row, err) do
    # exp backoff (pre-jitter): 5s · 10s · 20s · 40s · 80s · 160s · 320s · 640s
    # 최대 재시도 도달 시 CallbackOutbox.mark_failed 가 status=dead 로 전환.
    delay_s = trunc(:math.pow(2, min(row.attempts, 10)) * 5)
    jitter_s = :rand.uniform(3)
    next = DateTime.add(DateTime.utc_now(), delay_s + jitter_s, :second)

    case CallbackOutbox.mark_failed(row, err, next, @max_attempts) do
      {:ok, %{status: "dead"} = updated} ->
        Logger.error(
          "CallbackOutbox DEAD attempts=#{updated.attempts} cid=#{row.correlation_id} path=#{row.path} last_error=#{err}"
        )

      {:ok, updated} ->
        Logger.warning(
          "CallbackOutbox retry #{updated.attempts}/#{@max_attempts} in #{delay_s}s cid=#{row.correlation_id} path=#{row.path}"
        )

      {:error, changeset} ->
        Logger.error("CallbackOutbox mark_failed error: #{inspect(changeset.errors)}")
    end
  end

  defp schedule_tick(ms), do: Process.send_after(self(), :tick, ms)
  defp api_url, do: Application.get_env(:orchestrator, :api_url, "http://localhost:4000")
  defp orchestrator_secret, do: Application.get_env(:orchestrator, :orchestrator_secret, "")
end
