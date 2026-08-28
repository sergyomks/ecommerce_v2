

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_buscar_productos;

DELIMITER $$

CREATE PROCEDURE sp_contar_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255)
)
BEGIN
  SELECT COUNT(*) as total
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'));
END$$

DELIMITER ;
