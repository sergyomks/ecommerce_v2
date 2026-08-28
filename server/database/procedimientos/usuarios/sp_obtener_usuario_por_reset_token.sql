

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_reset_token;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_por_reset_token(IN p_token VARCHAR(255))
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.reset_contraseña_token = p_token AND u.reset_contraseña_expire > NOW();
END$$

DELIMITER ;
