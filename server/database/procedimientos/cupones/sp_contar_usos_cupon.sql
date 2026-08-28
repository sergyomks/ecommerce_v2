

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_usos_cupon;

DELIMITER $$

CREATE PROCEDURE sp_contar_usos_cupon(IN p_id CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_cupon = p_id;
END$$

DELIMITER ;
