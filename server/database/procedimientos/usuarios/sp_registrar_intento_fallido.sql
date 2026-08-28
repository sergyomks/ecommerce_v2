

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_registrar_intento_fallido;

DELIMITER $$

CREATE PROCEDURE sp_registrar_intento_fallido(
  IN p_email VARCHAR(100),
  IN p_max_intentos INT,
  IN p_minutos_bloqueo INT
)
BEGIN

  UPDATE usuarios
  SET bloqueado_hasta = IF(intentos_fallidos + 1 >= p_max_intentos,
                           NOW() + INTERVAL p_minutos_bloqueo MINUTE,
                           bloqueado_hasta),
      intentos_fallidos = IF(intentos_fallidos + 1 >= p_max_intentos,
                             0,
                             intentos_fallidos + 1)
  WHERE email = p_email;

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
