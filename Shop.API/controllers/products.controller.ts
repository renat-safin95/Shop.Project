import { Router } from "express";
import { Connection } from "mysql2/promise";

export function productsApiRouter(connection: Connection) {
  const router = Router();

  router.get("/stats", async (_, res) => {
    try {
      const [rows] = await connection.query(
        "SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as totalPrice FROM products"
      );

      const stats = (rows as any)[0];
      res.json(stats);
    } catch (err) {
      console.error("Error in /stats:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
