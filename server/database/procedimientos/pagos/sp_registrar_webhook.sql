

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_registrar_webhook;

DELIMITER $$

CREATE PROCEDURE sp_registrar_webhook(
  IN p_id CHAR(36), IN p_id_evento VARCHAR(255), IN p_tipo VARCHAR(100), IN p_id_cargo VARCHAR(255)
)
BEGIN
  INSERT INTO webhooks_procesados (id, id_evento, tipo_evento, id_cargo)
  VALUES (p_id, p_id_evento, p_tipo, p_id_cargo);
END$$

DELIMITER ;
