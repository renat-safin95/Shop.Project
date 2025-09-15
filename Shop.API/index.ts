import express, { Express } from "express";
import { Connection } from "mysql2/promise";
import { commentsRouter } from "./src/api/comments-api"
import { createProductsRouter } from "./src/api/products-api";
import { authRouter } from "./src/api/auth-api";
import { productsApiRouter } from "./controllers/products.controller"; 

export let connection: Connection;

export default function (dbConnection: Connection): Express {
  const app = express();
  app.use(express.json());

  connection = dbConnection;

  app.use("/comments", commentsRouter);
  app.use("/products", productsApiRouter(dbConnection));
  app.use("/auth", authRouter);

  return app;
}