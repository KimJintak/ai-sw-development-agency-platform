defmodule OrchestratorWeb.Plugs.AuthPlug do
  import Plug.Conn

  def init(opts), do: opts

  def call(conn, _opts) do
    expected = Application.get_env(:orchestrator, :orchestrator_secret, "")
    token = get_req_header(conn, "x-orchestrator-secret") |> List.first()

    if token && Plug.Crypto.secure_compare(token, expected) do
      conn
    else
      conn |> send_resp(401, Jason.encode!(%{error: "Unauthorized"})) |> halt()
    end
  end
end
