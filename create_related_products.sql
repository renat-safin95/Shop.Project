CREATE TABLE RelatedProducts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    related_product_id VARCHAR(36) NOT NULL,
    CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    CONSTRAINT fk_related_product FOREIGN KEY (related_product_id) REFERENCES Products(product_id) ON DELETE CASCADE,
    CONSTRAINT uc_product_related UNIQUE (product_id, related_product_id)
);