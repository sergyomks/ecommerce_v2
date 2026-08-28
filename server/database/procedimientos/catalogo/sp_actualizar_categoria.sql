

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_categoria;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE categorias
  SET nombre = p_nombre, slug = p_slug, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DELIMITER ;
