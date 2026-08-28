

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_verificar_email_en_uso;

DELIMITER $$

CREATE PROCEDURE sp_verificar_email_en_uso(IN p_email VARCHAR(100), IN p_id CHAR(36))
BEGIN
  SELECT id FROM usuarios WHERE email = p_email AND id <> p_id LIMIT 1;
END$$

DELIMITER ;
