

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_departamento_por_nombre;

DELIMITER $$

CREATE PROCEDURE sp_obtener_departamento_por_nombre(IN p_nombre VARCHAR(255))
BEGIN
  SELECT id FROM departamentos WHERE nombre = p_nombre LIMIT 1;
END$$

DELIMITER ;
