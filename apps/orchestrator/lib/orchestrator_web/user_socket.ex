defmodule OrchestratorWeb.UserSocket do
  use Phoenix.Socket

  # Agent connects here via WebSocket
  channel "agent:*", OrchestratorWeb.AgentChannel

  @impl true
  def connect(%{"agent_id" => agent_id, "agent_type" => agent_type, "secret" => secret}, socket, _info) do
    expected = Application.get_env(:orchestrator, :orchestrator_secret, "")
    if Plug.Crypto.secure_compare(secret, expected) do
      {:ok, assign(socket, agent_id: agent_id, agent_type: agent_type)}
    else
      :error
    end
  end

  def connect(_params, _socket, _info), do: :error

  @impl true
  def id(socket), do: "agent:#{socket.assigns.agent_id}"
end
