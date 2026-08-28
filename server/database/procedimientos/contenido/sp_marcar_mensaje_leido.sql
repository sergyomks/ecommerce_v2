

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_mensaje_leido;

DELIMITER $$

CREATE PROCEDURE sp_marcar_mensaje_leido(IN p_id CHAR(36))
BEGIN
  UPDATE mensajes_contacto SET leido = 1 WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
