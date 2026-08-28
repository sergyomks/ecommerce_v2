

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_subcategorias;

DELIMITER $$

CREATE PROCEDURE sp_listar_subcategorias(IN p_categoria_id CHAR(36), IN p_solo_activas INT)
BEGIN
  SELECT s.*, c.nombre AS categoria_padre_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE (p_categoria_id IS NULL OR s.id_categoria = p_categoria_id)
    AND (p_solo_activas = 0 OR (s.activo = 1 AND c.activo = 1))
  ORDER BY c.nombre ASC, s.nombre ASC;
END$$

DELIMITER ;
