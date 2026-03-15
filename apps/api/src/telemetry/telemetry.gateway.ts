import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { TelemetryEvents } from '@farmer-platform/types';
import { TelemetryService } from './telemetry.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'telemetry',
})
export class TelemetryGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TelemetryGateway.name);

  constructor(
    @Inject(forwardRef(() => TelemetryService))
    private readonly telemetryService: TelemetryService,
  ) { }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(TelemetryEvents.SUBSCRIBE)
  handleSubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} subscribed to job: ${data.jobId}`);
    client.join(`job:${data.jobId}`);
    return { status: 'ok', joined: data.jobId };
  }

  @SubscribeMessage(TelemetryEvents.UNSUBSCRIBE)
  handleUnsubscribe(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} unsubscribed from job: ${data.jobId}`);
    client.leave(`job:${data.jobId}`);
    return { status: 'ok', left: data.jobId };
  }

  @SubscribeMessage('telemetry:simulate:start')
  handleStartSimulation(
    @MessageBody() data: { jobId: string; tractorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} requested simulation for job: ${data.jobId}`);
    this.telemetryService.startSimulator(data.jobId, data.tractorId);
    return { status: 'ok', simulation: 'started' };
  }

  @SubscribeMessage('telemetry:simulate:stop')
  handleStopSimulation(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client ${client.id} requested stop simulation for job: ${data.jobId}`);
    this.telemetryService.stopSimulator(data.jobId);
    return { status: 'ok', simulation: 'stopped' };
  }

  /**
   * Broadcasts a telemetry point to all clients subscribed to a specific job.
   */
  broadcastUpdate(jobId: string, payload: any) {
    this.server.to(`job:${jobId}`).emit(TelemetryEvents.LIVE_UPDATE, payload);
  }
}
