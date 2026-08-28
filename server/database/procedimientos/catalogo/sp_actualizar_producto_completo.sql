

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_producto_completo;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_producto_completo(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON
)
BEGIN
  UPDATE productos
  SET nombre = p_nombre, descripcion = p_descripcion, precio = p_precio,
      id_categoria = p_id_categoria, id_subcategoria = p_id_subcategoria,
      stock = p_stock, imagenes = p_imagenes
  WHERE id = p_id;

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DELIMITER ;
