import { PrismaClient } from '@prisma/client';
import mongoose from 'mongoose';
import { createClient } from 'redis';

export const prisma = new PrismaClient();

export const connectMongo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/facebook-posts';
    await mongoose.connect(mongoUri);
    console.log('🍃 Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
};

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log('🚀 Connected to Redis');
  } catch (error) {
    console.error('❌ Redis Connection Error:', error);
  }
};
