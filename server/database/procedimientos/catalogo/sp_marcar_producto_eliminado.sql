

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_producto_eliminado;

DELIMITER $$

CREATE PROCEDURE sp_marcar_producto_eliminado(IN p_id CHAR(36))
BEGIN
  UPDATE productos SET estado = 'eliminado', fecha_eliminacion = NOW() WHERE id = p_id;
END$$

DELIMITER ;
