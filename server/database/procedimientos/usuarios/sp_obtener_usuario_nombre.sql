

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_nombre;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DELIMITER ;
