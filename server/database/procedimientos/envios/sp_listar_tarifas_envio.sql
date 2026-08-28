

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_tarifas_envio;

DELIMITER $$

CREATE PROCEDURE sp_listar_tarifas_envio(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT d.nombre AS departamento, t.precio
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    WHERE t.activo = 1
    ORDER BY d.nombre ASC;
  ELSE
    SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    ORDER BY d.nombre ASC;
  END IF;
END$$

DELIMITER ;
