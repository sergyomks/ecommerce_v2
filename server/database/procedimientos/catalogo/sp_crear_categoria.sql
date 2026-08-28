

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_categoria;

DELIMITER $$

CREATE PROCEDURE sp_crear_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON
)
BEGIN
  INSERT INTO categorias (id, nombre, slug, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_imagen, 1);

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DELIMITER ;
