

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_detalle_producto;

DELIMITER $$

CREATE PROCEDURE sp_obtener_detalle_producto(IN p_id CHAR(36))
BEGIN
  SELECT
      p.id, p.nombre, p.descripcion, p.precio,
      p.precio_oferta, p.oferta_inicio, p.oferta_fin,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria, c.nombre AS categoria_padre,
      p.calificaciones, p.imagenes, p.stock, p.estado, p.fecha_creacion, p.creado_por,
      COUNT(DISTINCT r.id) AS review_count,
      ROUND(AVG(r.calificacion), 2) AS promedio_calificacion,
      u.nombre AS vendedor_nombre, u.email AS vendedor_email
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  LEFT JOIN usuarios u ON p.creado_por = u.id
  WHERE p.id = p_id AND p.estado = 'activo'
  GROUP BY p.id;
END$$

DELIMITER ;
