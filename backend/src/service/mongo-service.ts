import mongoose, { Connection } from "mongoose";
import {
    MONGO_URI,
    MONGO_DB_NAME,
    MONGO_MIN_POOL_SIZE,
    MONGO_MAX_POOL_SIZE,
} from "../utils/config";
import { AppError } from "../error/AppError";

let dbConnection: Connection;

export const initMongo = async (): Promise<void> => {
    try {
        await mongoose.connect(MONGO_URI, {
            dbName: MONGO_DB_NAME,
            minPoolSize: MONGO_MIN_POOL_SIZE,
            maxPoolSize: MONGO_MAX_POOL_SIZE,
        });
        dbConnection = mongoose.connection;
        console.log("✅ MongoDB Connected (Mongoose)");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error);
        process.exit(1);
    }
};

export const getDb = () => {
    if (!mongoose.connection.db) {
        throw new AppError("Database not initialized. Call initMongo first.", 500);
    }
    return mongoose.connection.db;
};

export const closeMongo = async (): Promise<void> => {
    await mongoose.disconnect();
    console.log("✅ MongoDB Connection Closed");
};
