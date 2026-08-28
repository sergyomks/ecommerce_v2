

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_incrementar_uso_cupon;

DELIMITER $$

CREATE PROCEDURE sp_incrementar_uso_cupon(IN p_id_cupon CHAR(36))
BEGIN
  UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = p_id_cupon;
END$$

DELIMITER ;
