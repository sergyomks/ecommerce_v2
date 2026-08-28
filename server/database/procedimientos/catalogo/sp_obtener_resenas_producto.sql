

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_resenas_producto;

DELIMITER $$

CREATE PROCEDURE sp_obtener_resenas_producto(IN p_id CHAR(36))
BEGIN
  SELECT r.id, r.id_usuario, r.calificacion, r.comentario, r.fecha_creacion, u.nombre AS usuario_nombre, u.imagen AS usuario_imagen
  FROM resenas_productos r
  LEFT JOIN usuarios u ON r.id_usuario = u.id
  WHERE r.id_producto = p_id
  ORDER BY r.fecha_creacion DESC;
END$$

DELIMITER ;
