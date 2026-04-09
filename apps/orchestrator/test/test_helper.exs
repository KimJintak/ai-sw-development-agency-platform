# Unit tests are designed to run WITHOUT external dependencies
# (no Redis, no Postgres, no Phoenix endpoint). We stop the application
# so tests can start only the processes they need via `start_supervised!`.
Application.stop(:orchestrator)

# Integration tests (Phoenix Endpoint/ChannelCase/ConnCase) and Redis-backed
# tests are excluded by default. Run them explicitly:
#   mix test --include integration
#   mix test --include redis
ExUnit.start(exclude: [:integration, :redis])
