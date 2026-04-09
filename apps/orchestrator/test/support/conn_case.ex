defmodule OrchestratorWeb.ConnCase do
  @moduledoc """
  HTTP 컨트롤러 통합 테스트용 공통 case.

  Phoenix.ConnTest의 헬퍼와 Endpoint 참조를 제공한다. 이 case를 사용하는
  테스트는 `@moduletag :integration`을 붙여 기본 유닛 테스트 실행에서
  제외한다.
  """
  use ExUnit.CaseTemplate

  using do
    quote do
      import Plug.Conn
      import Phoenix.ConnTest
      import OrchestratorWeb.ConnCase

      @endpoint OrchestratorWeb.Endpoint
    end
  end

  setup _tags do
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end
end
