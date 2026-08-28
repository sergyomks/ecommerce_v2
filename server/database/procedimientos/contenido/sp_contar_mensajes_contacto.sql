

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_mensajes_contacto;

DELIMITER $$

CREATE PROCEDURE sp_contar_mensajes_contacto()
BEGIN
  SELECT COUNT(*) AS total FROM mensajes_contacto;
END$$

DELIMITER ;
