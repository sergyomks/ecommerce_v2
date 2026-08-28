

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_nuevos_productos;

DELIMITER $$

CREATE PROCEDURE sp_obtener_nuevos_productos()
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.fecha_creacion >= NOW() - INTERVAL 30 DAY AND p.estado = 'activo'
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT 8;
END$$

DELIMITER ;
