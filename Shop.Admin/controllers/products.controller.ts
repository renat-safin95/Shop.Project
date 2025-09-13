import { Router, Request, Response } from "express";
import {
  getProduct,
  getProducts,
  removeProduct,
  searchProducts,
  updateProduct,
  createProduct
} from "../models/products.model";
import { IProductFilterPayload } from "@Shared/types";
import { INewProductData, IProductEditData } from "../types";
import { throwServerError } from "./helper";
import { initDataBase } from "../../Server/services/db"

export const productsRouter = Router();

productsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const products = await getProducts();
    res.render("products", {
      items: products,
      queryParams: {},
    });
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get(
  "/search",
  async (req: Request<{}, {}, {}, IProductFilterPayload>, res: Response) => {
    try {
      const products = await searchProducts(req.query);
      res.render("products", {
        items: products,
        queryParams: req.query,
      });
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

productsRouter.get("/new-product", (req: Request, res: Response) => {
  if (req.session.username !== "admin") {
    res.status(403).send("Forbidden");
    return;
  }
  res.render("admin/new-product");
});

productsRouter.post("/new-product", async (req: Request<{}, {}, INewProductData>, res: Response) => {
  if (req.session.username !== "admin") {
    res.status(403).send("Forbidden");
    return;
  }

  const { name, description, price } = req.body;
  const newProduct = await createProduct({ name, description, price: Number(price) });

  res.redirect(`/${process.env.ADMIN_PATH}/${newProduct.id}`);
});


productsRouter.get('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const product = await getProduct(req.params.id);

    if (product) {
      const allProducts = await getProducts();

      const otherProducts = allProducts.filter(p =>
        p.id !== product.id &&
        !(product.related?.some(rp => rp.id === p.id))
      );

      res.render("product/product", {
        item: product,
        otherProducts
      });
    } else {
      res.render("product/empty-product", {
        id: req.params.id
      });
    }
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get("/remove-product/:id", async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (req.session.username !== "admin") {
      res.status(403).send("Forbidden");
      return;
    }

    await removeProduct(req.params.id);
    res.redirect(`/${process.env.ADMIN_PATH}`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post("/save/:id", async (req: Request<{ id: string }, {}, IProductEditData>, res: Response) => {
  try {
    const productId = req.params.id;

    await updateProduct(productId, req.body);

    const updatedProduct = await getProduct(productId);

    if (!updatedProduct) {
      res.render("product/empty-product", { id: productId });
      return;
    }

    const allProducts = await getProducts();
    const otherProducts = allProducts.filter(
      (p) =>
        p.id !== updatedProduct.id &&
        !updatedProduct.related?.some((r) => r.id === p.id)
    );

    res.render("product/product", {
      item: updatedProduct,
      otherProducts,
    });
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post(
  "/new-product",
  async (req: Request<{}, {}, INewProductData>, res: Response) => {
    try {
      if (req.session.username !== "admin") {
        res.status(403).send("Forbidden");
        return;
      }

      const { name, description, price } = req.body;

      const newProduct = await createProduct({
        name,
        description,
        price: Number(price),
      });

      res.redirect(`/${process.env.ADMIN_PATH}/`);
    } catch (e) {
      throwServerError(res, e);
    }
  }
);

productsRouter.get("/stats", async (_, res) => {
  try {
    const connection = await initDataBase();
    if (!connection) {
      return res.status(500).json({ error: "DB connection failed" });
    }

    const [rows] = await connection.query(
      "SELECT COUNT(*) as count, SUM(price) as totalPrice FROM products"
    );

    const stats = (rows as any)[0];
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
