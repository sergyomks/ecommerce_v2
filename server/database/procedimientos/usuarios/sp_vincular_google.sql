

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_vincular_google;

DELIMITER $$

CREATE PROCEDURE sp_vincular_google(
  IN p_id CHAR(36),
  IN p_google_id VARCHAR(64)
)
BEGIN
  UPDATE usuarios
  SET google_id = p_google_id
  WHERE id = p_id AND google_id IS NULL;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'GOOGLE_YA_VINCULADO';
  END IF;

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
