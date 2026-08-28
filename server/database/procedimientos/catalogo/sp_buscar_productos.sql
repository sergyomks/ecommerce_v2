

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_buscar_productos;

DELIMITER $$

CREATE PROCEDURE sp_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
      p.*,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria,
      c.nombre AS categoria_padre,
      COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'))
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DELIMITER ;
