

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_subcategoria;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_subcategoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM subcategorias WHERE id = p_id;
END$$

DELIMITER ;
