import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class SocketClient {
    private socket: Socket | null = null;

    getSocket(namespace = 'telemetry'): Socket {
        if (!this.socket) {
            this.socket = io(`${SOCKET_URL}/${namespace}`, {
                withCredentials: true,
                autoConnect: false,
                transports: ['websocket'],
            });
        }
        return this.socket;
    }

    connect() {
        if (this.socket && !this.socket.connected) {
            this.socket.connect();
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

export const socketClient = new SocketClient();
export default socketClient;
