

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_id;

DELIMITER $$

CREATE PROCEDURE sp_obtener_cupon_por_id(IN p_id CHAR(36), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE id = p_id LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE id = p_id LIMIT 1;
  END IF;
END$$

DELIMITER ;
