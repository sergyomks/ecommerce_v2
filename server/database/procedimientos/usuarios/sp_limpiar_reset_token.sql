

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_limpiar_reset_token;

DELIMITER $$

CREATE PROCEDURE sp_limpiar_reset_token(IN p_id CHAR(36))
BEGIN
  UPDATE usuarios SET reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DELIMITER ;
