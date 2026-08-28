

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_mensaje_contacto;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_mensaje_contacto(IN p_id CHAR(36))
BEGIN
  DELETE FROM mensajes_contacto WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
