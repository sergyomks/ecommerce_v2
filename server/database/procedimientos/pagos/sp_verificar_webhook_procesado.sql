

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_webhook_procesado;

DELIMITER $$

CREATE PROCEDURE sp_verificar_webhook_procesado(IN p_id_evento VARCHAR(255))
BEGIN
  SELECT id FROM webhooks_procesados WHERE id_evento = p_id_evento LIMIT 1;
END$$

DELIMITER ;
