import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway(4446, {
  cors: {
    origin: '*',
  },
  transports: ['websocket'],
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  pushNotificationStudentTakeRecord() {
    this.server.emit('student_take_record_session', 'jsdkjflasjdlkf');
  }
}
