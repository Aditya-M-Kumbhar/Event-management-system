import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(
      process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000',
      {
        withCredentials: true,
        autoConnect:     false,
        reconnection:    true,
        reconnectionAttempts: 5,
        reconnectionDelay:    1000,
      }
    );
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCheckInRoom = (eventId) => {
  const s = connectSocket();
  s.emit('join:checkin', eventId);
  return s;
};
