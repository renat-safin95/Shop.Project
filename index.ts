require('dotenv').config();

import express, { Express } from "express";
import path from "path";
import { Connection } from "mysql2/promise";
import { initDataBase } from "./Server/services/db";
import { initServer } from "./Server/services/server";
import ShopAPI from "./Shop.API";
import ShopAdmin from "./Shop.Admin";

export let server: Express;
export let connection: Connection;

async function launchApplication() {
  try {
    console.log("Starting server initialization...");
    server = initServer();
    console.log("Server initialized");
    
    connection = await initDataBase();
    console.log("Database connected");

    initRouter();
    console.log("Application launched successfully");
  } catch (error) {
    console.error("Failed to launch application:", error);
    process.exit(1);
  }
}

function initRouter() {
  const shopApi = ShopAPI(connection);
  server.use("/api/products", shopApi);

  const shopAdmin = ShopAdmin();
  server.use("/admin", shopAdmin);

  const clientBuildPath = path.join(__dirname, "shop-client/build");
  server.use(express.static(clientBuildPath));

  // Catch-all handler: send back React's index.html file for any non-API routes
  server.get("*", (req, res) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

launchApplication();