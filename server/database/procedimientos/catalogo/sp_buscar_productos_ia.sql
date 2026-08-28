

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_buscar_productos_ia;

DELIMITER $$

CREATE PROCEDURE sp_buscar_productos_ia(IN p_regex_keywords TEXT)
BEGIN
  SELECT p.*, c.nombre AS categoria
  FROM productos p
  INNER JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
  AND (p.nombre REGEXP p_regex_keywords OR p.descripcion REGEXP p_regex_keywords OR c.nombre REGEXP p_regex_keywords)
  LIMIT 200;
END$$

DELIMITER ;
