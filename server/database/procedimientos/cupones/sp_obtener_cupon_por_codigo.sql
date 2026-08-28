

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_codigo;

DELIMITER $$

CREATE PROCEDURE sp_obtener_cupon_por_codigo(IN p_codigo VARCHAR(50), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1;
  END IF;
END$$

DELIMITER ;
