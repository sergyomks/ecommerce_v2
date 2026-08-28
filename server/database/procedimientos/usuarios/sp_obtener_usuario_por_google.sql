

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_google;

DELIMITER $$

CREATE PROCEDURE sp_obtener_usuario_por_google(
  IN p_google_id VARCHAR(64),
  IN p_email VARCHAR(100)
)
BEGIN
  SELECT u.id, u.nombre, u.email, u.imagen, u.google_id, r.nombre AS rol,
         u.fecha_creacion,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id  IS NOT NULL) AS tiene_google,
         (u.google_id IS NOT NULL AND u.google_id = p_google_id) AS coincide_google
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.google_id = p_google_id OR u.email = p_email
  ORDER BY (u.google_id = p_google_id) DESC
  LIMIT 1;
END$$

DELIMITER ;
