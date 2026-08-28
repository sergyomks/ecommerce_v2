

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_resena;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_resena(IN p_id_producto CHAR(36), IN p_id_usuario CHAR(36))
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    DELETE FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

    SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
    UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;
  END IF;

  SELECT v_existe AS affected;
END$$

DELIMITER ;
