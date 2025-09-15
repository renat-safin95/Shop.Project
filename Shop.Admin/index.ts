import express, { Express } from "express";
import { productsRouter } from "./controllers/products.controller";
import layouts from "express-ejs-layouts";
import bodyParser from "body-parser";
import { authRouter, validateSession } from "./controllers/auth.controller";
import session from "express-session";
import path from "path";

export default function (): Express {
  const app = express();

  app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
  }));

  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  app.set("view engine", "ejs");
  app.set("views", "Shop.Admin/views");
  app.use(layouts);

  app.use(express.static(path.join(__dirname, "public")));

  app.use(validateSession);
  app.use((req, res, next) => {
    res.locals.user = req.session.username || null;
    next();
  });

  app.use("/auth", authRouter);
  app.use("/admin", productsRouter);

  const clientBuildPath = path.join(__dirname, "../shop-client/build");
  app.use(express.static(clientBuildPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  return app;
}