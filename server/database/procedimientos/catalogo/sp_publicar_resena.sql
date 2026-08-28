

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_publicar_resena;

DELIMITER $$

CREATE PROCEDURE sp_publicar_resena(
  IN p_id_resena CHAR(36),
  IN p_id_producto CHAR(36),
  IN p_id_usuario CHAR(36),
  IN p_calificacion INT,
  IN p_comentario TEXT
)
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    UPDATE resenas_productos SET calificacion = p_calificacion, comentario = p_comentario WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;
  ELSE
    INSERT INTO resenas_productos (id, id_producto, id_usuario, calificacion, comentario) VALUES (p_id_resena, p_id_producto, p_id_usuario, p_calificacion, p_comentario);
  END IF;

  SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
  UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;

  SELECT * FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario LIMIT 1;
END$$

DELIMITER ;
