import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cors from "cors";
import router from "./router/index";
import { AppError } from "./error/AppError";
import { ResponseDTO } from "./model/response";
import { initKafka } from "./service/kafka-producer";
const app = express();
// init middleware
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
// init body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// init cors
app.use(cors());

dotenv.config();

// init route
app.use("/api", router);

// handling 404 errors
app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new AppError("Not Found API", 404);
  next(error);
});

// handling general errors
app.use((error: any, req: Request, res: Response) => {
  const statusCode = error.statusCode || 500;
  ResponseDTO.error(
    error.message || "Internal Server Error",
    error.errors || null,
    statusCode
  );
  res.status(statusCode).json({
    status: "error",
    code: statusCode,
    message: error.message || "Internal Server Error",
    errors: error.errors || null,
  });
});

initKafka()
  .then(() => {
    console.log("Kafka Initialized, starting server...");
  })
  .catch((error) => {
    console.error("Failed to initialize Kafka:", error);
    process.exit(1);
  });

app.listen(process.env.PORT || 3000, () => {
  console.log(
    `Server is running on port ${process.env.PORT || 3000} in ${
      process.env.NODE_ENV
    } mode.`
  );
});
