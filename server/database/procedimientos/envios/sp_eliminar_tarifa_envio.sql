

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_eliminar_tarifa_envio;

DELIMITER $$

CREATE PROCEDURE sp_eliminar_tarifa_envio(IN p_id CHAR(36))
BEGIN
  DELETE FROM tarifas_envio WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
