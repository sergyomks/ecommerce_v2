

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
  IN p_imagenes JSON,
  IN p_precio_oferta DECIMAL(10,2),
  IN p_oferta_inicio DATETIME,
  IN p_oferta_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL
     AND (p_precio_oferta <= 0 OR p_precio_oferta >= p_precio) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PRECIO_OFERTA_INVALIDO';
  END IF;

  IF p_precio_oferta IS NOT NULL
     AND p_oferta_inicio IS NOT NULL
     AND p_oferta_fin IS NOT NULL
     AND p_oferta_fin < p_oferta_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET nombre = p_nombre, descripcion = p_descripcion, precio = p_precio,
      id_categoria = p_id_categoria, id_subcategoria = p_id_subcategoria,
      stock = p_stock, imagenes = p_imagenes,
      precio_oferta = p_precio_oferta,
      oferta_inicio = p_oferta_inicio,
      oferta_fin = p_oferta_fin
  WHERE id = p_id;

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
         fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
         (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DELIMITER ;
