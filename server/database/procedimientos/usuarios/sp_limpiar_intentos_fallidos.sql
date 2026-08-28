

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_limpiar_intentos_fallidos;

DELIMITER $$

CREATE PROCEDURE sp_limpiar_intentos_fallidos(IN p_id CHAR(36))
BEGIN

  UPDATE usuarios
  SET intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id = p_id AND (intentos_fallidos <> 0 OR bloqueado_hasta IS NOT NULL);

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
