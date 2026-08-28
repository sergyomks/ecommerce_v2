

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_contrasena;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_contrasena(IN p_id CHAR(36), IN p_hashed_password VARCHAR(255))
BEGIN
  UPDATE usuarios SET contraseña = p_hashed_password, reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DELIMITER ;
