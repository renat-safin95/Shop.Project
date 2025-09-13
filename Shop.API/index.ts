import express, { Express } from "express";
import { Connection } from "mysql2/promise";
import { commentsRouter } from "./src/api/comments-api"
import { createProductsRouter } from "./src/api/products-api";
import { authRouter } from "./src/api/auth-api";

export let connection: Connection;

export default function (dbConnection: Connection): Express {
  const app = express();
  app.use(express.json());

  connection = dbConnection;

  app.use("/comments", commentsRouter);
  const productsRouter = createProductsRouter(dbConnection);
  app.use("/products", productsRouter);
  app.use("/auth", authRouter);

  return app;
}
