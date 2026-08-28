

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_producto_por_id;

DELIMITER $$

CREATE PROCEDURE sp_obtener_producto_por_id(IN p_id CHAR(36))
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DELIMITER ;
