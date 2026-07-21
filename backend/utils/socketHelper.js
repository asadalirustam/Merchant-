import { Server } from 'socket.io';

let io = null;

export const initIO = (server, frontendUrl) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        frontendUrl
      ].filter(Boolean),
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

export const emitNotification = (type, title, message, meta = {}) => {
  if (io) {
    io.emit('notification', {
      id: `${Date.now()}-${Math.random()}`,
      type, // 'PRODUCT_ADD', 'LOW_STOCK', 'SALE_COMPLETED', etc.
      title,
      message,
      meta,
      timestamp: new Date(),
    });
  }
};
