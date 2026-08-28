

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_reset_token;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_reset_token(IN p_id CHAR(36), IN p_token VARCHAR(255), IN p_expire DATETIME)
BEGIN
  UPDATE usuarios SET reset_contraseña_token = p_token, reset_contraseña_expire = p_expire WHERE id = p_id;
END$$

DELIMITER ;
