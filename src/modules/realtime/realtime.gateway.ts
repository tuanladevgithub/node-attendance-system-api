import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AttendanceResultEntity } from 'src/db/entities/attendance-result.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private realtimeGatewayLog(message: string) {
    console.log(`[RealtimeGateway - Log] ${message}`);
  }

  afterInit(server: Server) {
    this.realtimeGatewayLog('Realtime gateway init.');
  }

  handleConnection(client: Socket) {
    this.realtimeGatewayLog(`Socket client id ${client.id} is connected.`);
  }

  handleDisconnect(client: Socket) {
    this.realtimeGatewayLog(`Socket client id ${client.id} is disconnected.`);
  }

  @SubscribeMessage('join_session_room')
  joinAttendanceSessionRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() sessionId: number,
  ) {
    if (!client.rooms.has(`SESSION_ROOM_${sessionId}`)) {
      client.join(`SESSION_ROOM_${sessionId}`);
      this.realtimeGatewayLog(
        `Socket client id ${client.id} join session room sessionId-${sessionId}`,
      );
    }
  }

  pushNotificationStudentTakeRecord(result: AttendanceResultEntity) {
    this.server
      .in(`SESSION_ROOM_${result.t_attendance_session_id}`)
      .emit('student_take_record_session', result);
  }
}
