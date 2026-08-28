

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_mensajes_contacto;

DELIMITER $$

CREATE PROCEDURE sp_listar_mensajes_contacto(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT id, nombre, email, asunto, mensaje, leido, fecha_creacion
  FROM mensajes_contacto
  ORDER BY fecha_creacion DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DELIMITER ;
