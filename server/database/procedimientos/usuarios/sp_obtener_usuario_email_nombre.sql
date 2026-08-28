

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_email_nombre;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_email_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre, email FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DELIMITER ;
