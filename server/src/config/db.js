import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { config } from './env.js';

let mongodInstance = null;

export async function connectDB(customUri = null) {
  try {
    let uri = customUri || config.mongoUri;

    if (!uri) {
      console.log('No MONGO_URI provided. Starting in-memory MongoDB server...');
      mongodInstance = await MongoMemoryServer.create();
      uri = mongodInstance.getUri();
      console.log(`In-memory MongoDB started at: ${uri}`);
    }

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);

    console.log(`Connected to MongoDB (${mongoose.connection.host})`);
    return mongoose.connection;
  } catch (err) {
    console.error('MongoDB connection error:', err);
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
