import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export function connectSocket(userId, role) {
  if (socket) disconnectSocket();

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('WebSocket 已连接');
    socket.emit('register', { userId, role });
  });

  socket.on('disconnect', () => {
    console.log('WebSocket 已断开');
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onStationUpdate(callback) {
  if (!socket) return;
  socket.on('station-update', callback);
  return () => socket.off('station-update', callback);
}

export function onSessionProgress(callback) {
  if (!socket) return;
  socket.on('session-progress', callback);
  return () => socket.off('session-progress', callback);
}

export function joinStation(stationId) {
  if (socket) socket.emit('join-station', stationId);
}

export function leaveStation(stationId) {
  if (socket) socket.emit('leave-station', stationId);
}

export function getSocket() {
  return socket;
}
