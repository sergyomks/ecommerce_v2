

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_subcategoria;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE subcategorias
  SET nombre = p_nombre, slug = p_slug, id_categoria = p_id_categoria, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DELIMITER ;
