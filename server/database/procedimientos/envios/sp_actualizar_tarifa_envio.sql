

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_tarifa_envio;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_tarifa_envio(
  IN p_id CHAR(36), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  UPDATE tarifas_envio SET precio = p_precio, activo = p_activo, fecha_actualizacion = NOW() WHERE id = p_id;

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DELIMITER ;
