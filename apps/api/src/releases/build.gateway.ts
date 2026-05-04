import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

// Emitted events (client → server)
//   build:subscribe   { buildId }
//   build:unsubscribe { buildId }
//
// Emitted events (server → client)
//   build:log    { buildId, chunk: string, timestamp: string }
//   build:status { buildId, status: BuildStatus, completedAt?: string }

@WebSocketGateway({
  namespace: '/builds',
  cors: { origin: true, credentials: true },
})
export class BuildGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(BuildGateway.name)

  @WebSocketServer()
  server!: Server

  handleConnection(client: Socket) {
    this.logger.debug(`build ws connected: ${client.id}`)
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`build ws disconnected: ${client.id}`)
  }

  @SubscribeMessage('build:subscribe')
  onSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { buildId: string },
  ) {
    if (!body?.buildId) return { ok: false, error: 'buildId required' }
    void client.join(`build:${body.buildId}`)
    return { ok: true }
  }

  @SubscribeMessage('build:unsubscribe')
  onUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { buildId: string },
  ) {
    if (!body?.buildId) return { ok: false }
    void client.leave(`build:${body.buildId}`)
    return { ok: true }
  }

  /** 빌드 로그 청크를 구독 중인 모든 클라이언트에 broadcast */
  emitLog(buildId: string, chunk: string) {
    this.server.to(`build:${buildId}`).emit('build:log', {
      buildId,
      chunk,
      timestamp: new Date().toISOString(),
    })
  }

  /** 빌드 상태 변경을 broadcast */
  emitStatus(buildId: string, status: string, completedAt?: Date) {
    this.server.to(`build:${buildId}`).emit('build:status', {
      buildId,
      status,
      completedAt: completedAt?.toISOString(),
    })
  }
}
