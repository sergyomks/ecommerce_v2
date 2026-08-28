

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_categoria_o_subcategoria;

DELIMITER $$

CREATE PROCEDURE sp_obtener_categoria_o_subcategoria(IN p_criterio VARCHAR(255))
BEGIN
  SELECT id, id_categoria AS id_categoria_padre, 'subcategoria' AS tipo
  FROM subcategorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;

  SELECT id, NULL AS id_categoria_padre, 'categoria' AS tipo
  FROM categorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;
END$$

DELIMITER ;
