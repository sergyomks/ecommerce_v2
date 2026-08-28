

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_id;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_por_id(IN p_id CHAR(36))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen,
         u.reset_contraseña_token, u.reset_contraseña_expire, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id
  LIMIT 1;
END$$

DELIMITER ;
