import express, { Express } from "express";
import { productsRouter } from "./controllers/products.controller";
import layouts from "express-ejs-layouts";
import bodyParser from "body-parser";
import { authRouter, validateSession } from "./controllers/auth.controller";
import session from "express-session";
import path from "path";

export default function (): Express {
  const app = express();

  // Сессии
  app.use(session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false
  }));

  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));

  // EJS для админки
  app.set("view engine", "ejs");
  app.set("views", "Shop.Admin/views");
  app.use(layouts);

  app.use(express.static(__dirname + "/public"));

  // Валидация сессии
  app.use(validateSession);
  
  app.use((req, res, next) => {
    res.locals.user = req.session.username || null;
    next();
  });

  // --- Роуты админки и API ---
  app.use("/auth", authRouter);
  app.use("/admin", productsRouter);   // 👈 теперь только /admin, а не "/"

  // --- React-клиент ---
  const clientBuildPath = path.join(__dirname, "../shop-client/build");
  app.use(express.static(clientBuildPath));

  // Всё остальное → React SPA
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });

  return app;
}
