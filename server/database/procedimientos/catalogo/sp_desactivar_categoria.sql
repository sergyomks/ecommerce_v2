

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_desactivar_categoria;

DELIMITER $$

CREATE PROCEDURE sp_desactivar_categoria(IN p_id CHAR(36))
BEGIN
  UPDATE categorias SET activo = 0, fecha_actualizacion = NOW() WHERE id = p_id;
END$$

DELIMITER ;
