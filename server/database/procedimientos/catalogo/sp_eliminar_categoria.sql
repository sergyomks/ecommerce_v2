

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_categoria;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_categoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM categorias WHERE id = p_id;
END$$

DELIMITER ;
