import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { config } from './config/env.js';

const server = http.createServer(app);

async function startServer() {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`🚀 ParcelTrack server running in ${config.nodeEnv} mode on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}


const shutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await disconnectDB();
    console.log('Server process terminated.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

startServer();

export { server };
