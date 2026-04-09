defmodule OrchestratorWeb.ChannelCase do
  @moduledoc """
  Phoenix 채널 테스트용 공통 case.

  `OrchestratorWeb.Endpoint`를 부팅하고 `Phoenix.ChannelTest`의 헬퍼를
  노출한다. 이 case를 사용하는 테스트는 `@moduletag :integration`을
  붙여 기본 유닛 테스트 실행에서 제외한다 (test_helper.exs 참고).
  """
  use ExUnit.CaseTemplate

  using do
    quote do
      import Phoenix.ChannelTest
      import OrchestratorWeb.ChannelCase

      @endpoint OrchestratorWeb.Endpoint
    end
  end

  setup _tags do
    # 주의: test_helper.exs가 `:orchestrator`를 stop하므로, 이 case를
    # 쓰는 integration 테스트는 Endpoint / AgentRegistry / ProjectSupervisor
    # 등을 개별적으로 `start_supervised!`로 부팅해야 한다. Phase 3에서
    # 통합 테스트 fixture를 완성하면서 공통 setup으로 이동 예정.
    :ok
  end
end
