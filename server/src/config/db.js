import mongoose from 'mongoose';
import { config } from './env.js';

let mongodInstance = null;

export async function connectDB(customUri = null) {
  try {
    let uri = customUri || (process.env.NODE_ENV === 'test' ? null : config.mongoUri);

    if (!uri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable is required in production.');
      }
      console.log('No MONGO_URI provided. Starting in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`In-memory MongoDB started at: ${uri}`);
    }

    // Mask password in logs for secure debugging
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:*****@');
    console.log(`Connecting to MongoDB at: ${sanitizedUri}...`);

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });

    console.log(`✅ Connected to MongoDB (${mongoose.connection.host})`);
    return mongoose.connection;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message || err);

    if (
      err.name === 'MongooseServerSelectionError' ||
      err.message?.includes('buffering timed out') ||
      err.message?.includes('timed out')
    ) {
      console.error('\n======================================================');
      console.error('⚠️  MONGODB ATLAS NETWORK ACCESS BLOCKED:');
      console.error('Render cloud IPs are blocked by your MongoDB Atlas IP whitelist.');
      console.error('To fix:');
      console.error('1. Go to cloud.mongodb.com -> "Network Access" (left menu).');
      console.error('2. Click "Add IP Address".');
      console.error('3. Select "Allow Access From Anywhere" (0.0.0.0/0) and click Confirm.');
      console.error('======================================================\n');
    }

    throw err;
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    console.log('MongoDB disconnected');
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}
