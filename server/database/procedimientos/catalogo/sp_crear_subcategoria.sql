

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_subcategoria;

DELIMITER $$

CREATE PROCEDURE sp_crear_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  INSERT INTO subcategorias (id, nombre, slug, id_categoria, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_id_categoria, p_imagen, p_activo);

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DELIMITER ;
