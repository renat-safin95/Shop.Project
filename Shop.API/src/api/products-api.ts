import { Request, Response, Router } from "express";
import { Connection } from "mysql2/promise";
import { v4 as uuidv4 } from 'uuid';
import { OkPacket, RowDataPacket } from "mysql2";
import { enhanceProductsComments, enhanceProductsImages, getProductsFilterQuery } from "../helpers";
import {
  ICommentEntity,
  ImagesRemovePayload,
  IProductEntity,
  IProductImageEntity,
  IProductSearchFilter,
  ProductAddImagesPayload,
  ProductCreatePayload
} from "../../types";
import { mapCommentsEntity, mapImagesEntity, mapProductsEntity } from "../services/mapping";
import {
  DELETE_IMAGES_QUERY,
  INSERT_PRODUCT_IMAGES_QUERY,
  INSERT_PRODUCT_QUERY,
  REPLACE_PRODUCT_THUMBNAIL, 
  UPDATE_PRODUCT_FIELDS,
  SELECT_RELATED_PRODUCTS,
  INSERT_RELATED_PRODUCTS,
  DELETE_RELATED_PRODUCTS
} from "../services/queries";
import { IProduct, IProductImage } from "@Shared/types";

interface StatsRow extends RowDataPacket {
  count: number;
  totalPrice: number;
}

export const createProductsRouter = (dbConnection: Connection) => {
  const productsRouter = Router();

const throwServerError = (res: Response, e: Error) => {
  console.debug(e.message);
  res.status(500);
  res.send("Something went wrong");
}

productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const [productRows] = await dbConnection.query<IProductEntity[]>("SELECT * FROM products");
    const [commentRows] = await dbConnection.query<ICommentEntity[]>("SELECT * FROM comments");
    const [imageRows] = await dbConnection.query<IProductImageEntity[]>("SELECT * FROM images");

    const products = mapProductsEntity(productRows);
    const withComments = enhanceProductsComments(products, commentRows);
    const withImages = enhanceProductsImages(withComments, imageRows)

    res.send(withImages);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/search', async (
  req: Request<{}, {}, {}, IProductSearchFilter>,
  res: Response
) => {
  try {
    const [query, values] = getProductsFilterQuery(req.query);
    const [rows] = await dbConnection.query<IProductEntity[]>(query, values);

    if (!rows?.length) {
      res.send([]);
      return;
    }

    const [commentRows] = await dbConnection.query<ICommentEntity[]>("SELECT * FROM comments");
    const [imageRows] = await dbConnection.query<IProductImageEntity[]>("SELECT * FROM images");

    const products = mapProductsEntity(rows);
    const withComments = enhanceProductsComments(products, commentRows);
    const withImages = enhanceProductsImages(withComments, imageRows)

    res.send(withImages);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get("/stats", async (req, res) => {
  try {
    console.log("Stats route: Executing query...");
    const [rows] = await dbConnection.query<StatsRow[]>(
      "SELECT COUNT(*) as count, COALESCE(SUM(price), 0) as totalPrice FROM products"
    );

    console.log("Stats route: Query result:", rows);
    const stats = rows[0] || { count: 0, totalPrice: 0 };
    console.log("Stats route: Final stats:", stats);
    res.json(stats);
  } catch (e) {
    console.error("Stats route error:", e);
    res.status(500).json({ count: 0, totalPrice: 0 });
  }
});

productsRouter.get('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const [rows] = await dbConnection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${req.params.id} is not found`);
      return;
    }

    const [comments] = await dbConnection.query<ICommentEntity[]>(
      "SELECT * FROM comments WHERE product_id = ?",
      [req.params.id]
    );

    const [images] = await dbConnection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id = ?",
      [req.params.id]
    );

    const product = mapProductsEntity(rows)[0];

    if (comments.length) {
      product.comments = mapCommentsEntity(comments);
    }

    if (images.length) {
      product.images = mapImagesEntity(images);
      product.thumbnail = product.images.find(image => image.main) || product.images[0];
    }

    res.send(product);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/', async (
  req: Request<{}, {}, ProductCreatePayload>,
  res: Response
) => {
  try {
    const { title, description, price, images } = req.body;
    const productId = uuidv4();

    await dbConnection.query<OkPacket>(
      INSERT_PRODUCT_QUERY,
      [productId, title || null, description || null, price || null]
    );

    let insertedImages: IProductImage[] | undefined;

    if (images && images.length > 0) {
      const values = images.map((image) => [
        uuidv4(),
        image.url,
        productId,
        image.main,
      ]);

      await dbConnection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);

      // собираем массив изображений для возврата
      insertedImages = values.map(([id, url, productId, main]) => ({
        id: id as string,
        url: url as string,
        productId: productId as string,
        main: main as boolean,
      }));
    }

    const product: IProduct = {
      id: productId,
      title: title || "",
      description: description || "",
      price: price || 0,
      images: insertedImages,
    };

    res.status(201).json(product);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.delete('/:id', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    await dbConnection.query<OkPacket>(
      "DELETE FROM RelatedProducts WHERE product_id = ? OR related_product_id = ?",
      [req.params.id, req.params.id]
    );

    const [rows] = await dbConnection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [req.params.id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${req.params.id} is not found`);
      return;
    }

    await dbConnection.query<OkPacket>(
      "DELETE FROM images WHERE product_id = ?",
      [req.params.id]
    );

    await dbConnection.query<OkPacket>(
      "DELETE FROM comments WHERE product_id = ?",
      [req.params.id]
    );

    await dbConnection.query<OkPacket>(
      "DELETE FROM products WHERE product_id = ?",
      [req.params.id]
    );

    res.status(200);
    res.end();
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/add-images', async (
  req: Request<{}, {}, ProductAddImagesPayload>,
  res: Response
) => {
  try {
    const { productId, images } = req.body;

    if (!images?.length) {
      res.status(400);
      res.send("Images array is empty");
      return;
    }

    const values = images.map((image) => [uuidv4(), image.url, productId, image.main]);
    await dbConnection.query<OkPacket>(INSERT_PRODUCT_IMAGES_QUERY, [values]);

    res.status(201);
    res.send(`Images for a product id:${productId} have been added!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/remove-images', async (
  req: Request<{}, {}, ImagesRemovePayload>,
  res: Response
) => {
  try {
    const imagesToRemove = req.body;

    if (!imagesToRemove?.length) {
      res.status(400);
      res.send("Images array is empty");
      return;
    }

    const [info] = await dbConnection.query<OkPacket>(DELETE_IMAGES_QUERY, [[imagesToRemove]]);

    if (info.affectedRows === 0) {
      res.status(404);
      res.send("No one image has been removed");
      return;
    }

    res.status(200);
    res.send(`Images have been removed!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/update-thumbnail/:id', async (
  req: Request<{ id: string }, {}, { newThumbnailId: string }>,
  res: Response
) => {
  try {
    const [currentThumbnailRows] = await dbConnection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id=? AND main=?",
      [req.params.id, 1]
    );

    if (!currentThumbnailRows?.length || currentThumbnailRows.length > 1) {
      res.status(400);
      res.send("Incorrect product id");
      return;
    }

    const [newThumbnailRows] = await dbConnection.query<IProductImageEntity[]>(
      "SELECT * FROM images WHERE product_id=? AND image_id=?",
      [req.params.id, req.body.newThumbnailId]
    );

    if (newThumbnailRows?.length !== 1) {
      res.status(400);
      res.send("Incorrect new thumbnail id");
      return;
    }

    const currentThumbnailId = currentThumbnailRows[0].image_id;
    const [info] = await dbConnection.query<OkPacket>(
      REPLACE_PRODUCT_THUMBNAIL,
      [currentThumbnailId, req.body.newThumbnailId, currentThumbnailId, req.body.newThumbnailId]
    );

    if (info.affectedRows === 0) {
      res.status(404);
      res.send("No one image has been updated");
      return;
    }

    res.status(200);
    res.send("New product thumbnail has been set!");
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.patch('/:id', async (
  req: Request<{ id: string }, {}, ProductCreatePayload>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const [rows] = await dbConnection.query<IProductEntity[]>(
      "SELECT * FROM products WHERE product_id = ?",
      [id]
    );

    if (!rows?.[0]) {
      res.status(404);
      res.send(`Product with id ${id} is not found`);
      return;
    }

    const currentProduct = rows[0];

    await dbConnection.query<OkPacket>(
      UPDATE_PRODUCT_FIELDS,
      [
        req.body.hasOwnProperty("title") ? req.body.title : currentProduct.title,
        req.body.hasOwnProperty("description") ? req.body.description : currentProduct.description,
        req.body.hasOwnProperty("price") ? req.body.price : currentProduct.price,
        id
      ]
    );

    res.status(200);
    res.send(`Product id:${id} has been added!`);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.get('/:id/related', async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const [rows] = await dbConnection.query<IProductEntity[]>(
      SELECT_RELATED_PRODUCTS,
      [req.params.id]
    );

    res.send(rows);
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post('/related', async (
  req: Request<{}, {}, { product_id: string; related_product_id: string }[]>,
  res: Response
) => {
  try {
    const pairs = req.body;

    if (!Array.isArray(pairs) || !pairs.length) {
      res.status(400).send("Body must be a non-empty array");
      return;
    }

    // превращаем [{a, b}, {c, d}] -> [[a, b], [c, d]]
    const values = pairs.map(p => [p.product_id, p.related_product_id]);

    await dbConnection.query<OkPacket>(INSERT_RELATED_PRODUCTS, [values]);

    res.status(201).send("Relations have been added!");
  } catch (e: any) {
    if (e.code === "ER_DUP_ENTRY") {
      res.status(400).send("Some relations already exist");
      return;
    }
    throwServerError(res, e);
  }
});

productsRouter.delete('/related', async (
  req: Request<{}, {}, string[]>,
  res: Response
) => {
  try {
    const productIds = req.body;

    if (!Array.isArray(productIds) || !productIds.length) {
      res.status(400).send("Body must be a non-empty array");
      return;
    }

    const [info] = await dbConnection.query<OkPacket>(
      DELETE_RELATED_PRODUCTS,
      [productIds]
    );

    if (info.affectedRows === 0) {
      res.status(404).send("No relations found for provided ids");
      return;
    }

    res.status(200).send("Relations have been deleted!");
  } catch (e) {
    throwServerError(res, e);
  }
});

productsRouter.post("/:id/related/add", async (req, res) => {
  const { id } = req.params;
  const { relatedIds } = req.body;

  if (!Array.isArray(relatedIds) || relatedIds.length === 0) {
    return res.status(400).json({ error: "relatedIds must be a non-empty array" });
  }

  try {
    const values = relatedIds.map((rid: string) => [id, rid]);
    await dbConnection.query(INSERT_RELATED_PRODUCTS, [values]);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add related products" });
  }
});

productsRouter.post("/:id/related/remove", async (req, res) => {
  const { id } = req.params;
  const { relatedIds } = req.body;

  if (!Array.isArray(relatedIds) || relatedIds.length === 0) {
    return res.status(400).json({ error: "relatedIds must be a non-empty array" });
  }

  try {
    await dbConnection.query(DELETE_RELATED_PRODUCTS, [id, relatedIds]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove related products" });
  }
});

  return productsRouter;
};