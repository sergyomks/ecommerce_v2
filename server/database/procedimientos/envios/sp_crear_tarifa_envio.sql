

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_crear_tarifa_envio;

DELIMITER $$

CREATE PROCEDURE sp_crear_tarifa_envio(
  IN p_id CHAR(36), IN p_id_departamento CHAR(2), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  INSERT INTO tarifas_envio (id, id_departamento, precio, activo)
  VALUES (p_id, p_id_departamento, p_precio, p_activo);

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DELIMITER ;
