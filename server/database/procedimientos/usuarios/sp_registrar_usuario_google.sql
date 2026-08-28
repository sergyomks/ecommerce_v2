

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_registrar_usuario_google;

DELIMITER $$

CREATE PROCEDURE sp_registrar_usuario_google(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_google_id VARCHAR(64),
  IN p_imagen JSON,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, google_id, imagen, id_rol)
  VALUES (p_id, p_nombre, p_email, NULL, p_google_id, p_imagen, p_id_rol);

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
