

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_usuarios_por_rol;

DELIMITER $$

CREATE PROCEDURE sp_contar_usuarios_por_rol(IN p_rol_nombre VARCHAR(50))
BEGIN
  SELECT COUNT(*) AS total_usuarios
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre;
END$$

DELIMITER ;
