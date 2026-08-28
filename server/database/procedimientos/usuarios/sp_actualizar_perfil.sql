

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_perfil;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_perfil(IN p_id CHAR(36), IN p_nombre VARCHAR(100), IN p_email VARCHAR(100), IN p_imagen JSON)
BEGIN
  IF p_imagen IS NOT NULL THEN
    UPDATE usuarios SET nombre = p_nombre, email = p_email, imagen = p_imagen WHERE id = p_id;
  ELSE
    UPDATE usuarios SET nombre = p_nombre, email = p_email WHERE id = p_id;
  END IF;

  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id;
END$$

DELIMITER ;
