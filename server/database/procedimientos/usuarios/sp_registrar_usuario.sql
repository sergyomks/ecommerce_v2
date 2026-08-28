

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_registrar_usuario;

DELIMITER $$

CREATE PROCEDURE sp_registrar_usuario(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_contrasena TEXT,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, id_rol)
  VALUES (p_id, p_nombre, p_email, p_contrasena, p_id_rol);
END$$

DELIMITER ;
