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
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Server, Socket } from 'socket.io'
import type { ChatMessage } from '@prisma/client'
import { ChatService } from './chat.service'

interface SocketData {
  userId: string
  email: string
  name?: string
  rooms: Set<string>
}

function data(client: Socket): SocketData {
  return client.data as SocketData
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name)

  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly service: ChatService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        (client.handshake.query?.token as string | undefined)
      if (!token) {
        client.disconnect(true)
        return
      }
      const payload = await this.jwt.verifyAsync<{
        sub: string
        email: string
        name?: string
      }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      })
      client.data = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        rooms: new Set<string>(),
      } satisfies SocketData
      this.logger.log(`chat ws connected: user=${payload.sub}`)
    } catch (err) {
      this.logger.warn(`chat ws auth failed: ${(err as Error).message}`)
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket) {
    const d = client.data as SocketData | undefined
    if (d) this.logger.log(`chat ws disconnected: user=${d.userId}`)
  }

  @SubscribeMessage('room:join')
  async onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { projectId: string },
  ) {
    const d = data(client)
    if (!d) return { ok: false, error: 'unauthenticated' }
    try {
      await this.service.assertProjectAccess(body.projectId, d.userId)
    } catch {
      return { ok: false, error: 'forbidden' }
    }
    const room = `project:${body.projectId}`
    void client.join(room)
    d.rooms.add(room)
    return { ok: true }
  }

  @SubscribeMessage('room:leave')
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: { projectId: string }) {
    const d = data(client)
    if (!d) return { ok: false }
    const room = `project:${body.projectId}`
    void client.leave(room)
    d.rooms.delete(room)
    return { ok: true }
  }

  broadcastMessage(projectId: string, message: ChatMessage) {
    this.server.to(`project:${projectId}`).emit('chat:message', message)
  }
}
