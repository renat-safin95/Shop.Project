import express, { Express } from "express";

const host = process.env.LOCAL_PATH || 'localhost';
const port = Number(process.env.LOCAL_PORT) || 3000;

export function initServer(): Express {
  const app = express();

  const jsonMiddleware = express.json();
  app.use(jsonMiddleware);

  app.listen(port, host, () => {
    console.log(`Server running on port ${port}`);
  });

  return app;
}