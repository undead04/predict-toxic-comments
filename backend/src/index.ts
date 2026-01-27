import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cors from "cors";
import router from "./router/index";
import { AppError } from "./error/AppError";
import { ResponseDTO } from "./model/response";
import { initKafka } from "./service/kafka-producer";
import { NODE_ENV, PORT } from "./utils/config";
import { initRedis } from "./service/redis-service";
import { initMongo } from "./service/mongo-service";
import http from "http";
import { Server } from "socket.io";
import {
  initSocket,
  initMongoListener,
} from "./service/socket-service";
import { initSSERealtimeListener } from "./service/sse-service";
const app = express();

// const httpServer = http.createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "*", // Adjust as needed for security
//     methods: ["GET", "POST"],
//   },
// });

// init middleware
// Configure helmet to allow SSE connections
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow SSE
}));
app.use(morgan("dev"));
app.use(compression({
  filter: (req: Request, res: Response) => {
    if (req.originalUrl && req.originalUrl.includes('/youtube/events/')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
// init body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init cors
app.use(cors());

// init route
app.use("/api", router);

// handling 404 errors
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new AppError("Not Found API", 404);
  next(error);
});

// handling general errors
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = error.statusCode || 500;
  ResponseDTO.error(
    error.message || "Internal Server Error",
    error.errors || null,
    statusCode,
  );
  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
  });
});

initRedis()
  .then(() => {
    console.log("Redis Initialized");
  })
  .catch((error) => {
    console.error(error);
  });

initKafka()
  .then(() => {
    console.log("Kafka Initialized");
  })
  .catch((error) => {
    console.error("Failed to initialize Kafka:", error);
    process.exit(1);
  });

initMongo()
  .then(() => {
    console.log("MongoDB Initialized");
  })
  .catch((error) => {
    console.error("Failed to initialize MongoDB:", error);
    process.exit(1);
  });

// Initialize Socket.IO and Mongo Listeners
// initSocket(io);
// initMongoListener(io);
initSSERealtimeListener();

const serverPort = PORT || 3000;
app.listen(serverPort, () => {
  console.log(`Server is running on port ${serverPort} in ${NODE_ENV} mode.`);
});
