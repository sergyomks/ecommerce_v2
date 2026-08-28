

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_usuario;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_usuario(IN p_id CHAR(36))
BEGIN
  DELETE FROM usuarios WHERE id = p_id;
END$$

DELIMITER ;
