

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_email;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_por_email(IN p_email VARCHAR(100))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen, u.fecha_creacion,
         u.intentos_fallidos, u.bloqueado_hasta,
         u.google_id,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id IS NOT NULL) AS tiene_google,
         (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS esta_bloqueado,
         TIMESTAMPDIFF(SECOND, NOW(), u.bloqueado_hasta) AS segundos_restantes
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.email = p_email
  LIMIT 1;
END$$

DELIMITER ;
