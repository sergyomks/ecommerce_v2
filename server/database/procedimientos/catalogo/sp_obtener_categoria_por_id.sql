

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_categoria_por_id;

DELIMITER $$

CREATE PROCEDURE sp_obtener_categoria_por_id(IN p_id CHAR(36))
BEGIN
  SELECT * FROM categorias WHERE id = p_id LIMIT 1;
END$$

DELIMITER ;
