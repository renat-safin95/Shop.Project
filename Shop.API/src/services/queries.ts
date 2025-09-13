export const COMMENT_DUPLICATE_QUERY = `
  SELECT * FROM comments c
  WHERE LOWER(c.email) = ?
  AND LOWER(c.name) = ?
  AND LOWER(c.body) = ?
  AND c.product_id = ?
`;

export const INSERT_COMMENT_QUERY = `
  INSERT INTO comments
  (comment_id, email, name, body, product_id)
  VALUES
  (?, ?, ?, ?, ?)
`;

export const INSERT_PRODUCT_QUERY = `
  INSERT INTO products
  (product_id, title, description, price)
  VALUES
  (?, ?, ?, ?)
`;

export const INSERT_PRODUCT_IMAGES_QUERY = `
  INSERT INTO images
  (image_id, url, product_id, main)
  VALUES ?
`;

export const DELETE_IMAGES_QUERY = `
  DELETE FROM images 
  WHERE image_id IN ?;
`;

export const REPLACE_PRODUCT_THUMBNAIL = `
  UPDATE images
  SET main = CASE
    WHEN image_id = ? THEN 0
    WHEN image_id = ? THEN 1
    ELSE main
END
WHERE image_id IN (?, ?);
`

export const UPDATE_PRODUCT_FIELDS = `
    UPDATE products 
    SET title = ?, description = ?, price = ? 
    WHERE product_id = ?
`

export const SELECT_RELATED_PRODUCTS = `
  SELECT p.product_id, p.title, p.description, p.price
  FROM RelatedProducts r
  JOIN Products p ON r.related_product_id = p.product_id
  WHERE r.product_id = ?
`;

export const INSERT_RELATED_PRODUCTS = `
  INSERT INTO RelatedProducts (product_id, related_product_id)
  VALUES ?
`;

export const DELETE_RELATED_PRODUCTS = `
  DELETE FROM RelatedProducts
  WHERE product_id = ?
  AND related_product_id IN (?);
`;