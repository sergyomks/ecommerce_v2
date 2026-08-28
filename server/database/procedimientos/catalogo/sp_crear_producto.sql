

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_producto;

DELIMITER $$

CREATE PROCEDURE sp_crear_producto(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON,
  IN p_creado_por CHAR(36)
)
BEGIN
  INSERT INTO productos (id, nombre, descripcion, precio, id_categoria, id_subcategoria, stock, imagenes, creado_por)
  VALUES (p_id, p_nombre, p_descripcion, p_precio, p_id_categoria, p_id_subcategoria, p_stock, p_imagenes, p_creado_por);

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DELIMITER ;
