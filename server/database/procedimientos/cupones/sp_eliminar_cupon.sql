

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_cupon;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_cupon(IN p_id CHAR(36))
BEGIN
  DELETE FROM cupones WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
