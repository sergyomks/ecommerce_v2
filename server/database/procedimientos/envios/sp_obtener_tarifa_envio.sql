

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_tarifa_envio;

DELIMITER $$

CREATE PROCEDURE sp_obtener_tarifa_envio(IN p_id CHAR(36))
BEGIN
  SELECT * FROM tarifas_envio WHERE id = p_id LIMIT 1;
END$$

DELIMITER ;
