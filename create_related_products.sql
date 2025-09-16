CREATE TABLE related_products (
    product_id VARCHAR(36) NOT NULL,
    related_product_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_related_product FOREIGN KEY (related_product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    CONSTRAINT uc_product_related UNIQUE (product_id, related_product_id)
);