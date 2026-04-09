defmodule Orchestrator.RedisConsumerTest do
  @moduledoc """
  `Orchestrator.RedisConsumer` 통합 테스트 스켈레톤.

  실제 Redis 인스턴스(XADD/XREADGROUP) 또는 Redix mock이 필요하므로
  `:redis` 태그로 분리. 기본 실행에서 제외된다.

      mix test --include redis

  ## 커버 대상
  - orchestrator:tasks 스트림에 XADD된 메시지가 consumer loop에서 소비됨
  - 해당 ProjectOrchestrator가 없으면 lazy-start
  - 메시지 처리 후 XACK 확인
  - 잘못된 payload도 XACK (dead-letter는 Phase 3)
  """
  use ExUnit.Case, async: false

  @moduletag :redis

  @tag :skip
  test "consumes XADDed task and dispatches to ProjectOrchestrator" do
    # setup: Redix 연결, XGROUP CREATE, XADD로 task 주입
    # assert: ProjectOrchestrator.whereis(project_id) != nil
    # assert: XPENDING이 0
    flunk("integration test not implemented yet")
  end

  @tag :skip
  test "lazy-starts ProjectOrchestrator when first task arrives" do
    flunk("integration test not implemented yet")
  end

  @tag :skip
  test "XACKs malformed payload instead of blocking the stream" do
    flunk("integration test not implemented yet")
  end
end
