import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function createSocket() {
  const token = localStorage.getItem('token');
  return io(BACKEND_URL, {
    autoConnect: false,
    auth: { token },
  });
}

let socket = createSocket();

export function reconnectSocket() {
  if (socket.connected) socket.disconnect();
  socket = createSocket();
  return socket;
}

export default socket;
