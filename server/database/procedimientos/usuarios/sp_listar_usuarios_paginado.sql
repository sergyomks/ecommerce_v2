

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_usuarios_paginado;

DELIMITER $$

CREATE PROCEDURE sp_listar_usuarios_paginado(
  IN p_rol_nombre VARCHAR(50),
  IN p_limite INT,
  IN p_offset INT
)
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre
  ORDER BY u.fecha_creacion DESC
  LIMIT p_limite OFFSET p_offset;
END$$

DELIMITER ;
