

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_mensaje_contacto;

DELIMITER $$

CREATE PROCEDURE sp_crear_mensaje_contacto(
  IN p_id CHAR(36), IN p_nombre VARCHAR(255), IN p_email VARCHAR(255),
  IN p_asunto VARCHAR(255), IN p_mensaje TEXT
)
BEGIN
  INSERT INTO mensajes_contacto (id, nombre, email, asunto, mensaje)
  VALUES (p_id, p_nombre, p_email, p_asunto, p_mensaje);
END$$

DELIMITER ;
