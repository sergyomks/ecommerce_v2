

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_rol_por_nombre;

DELIMITER $$

CREATE PROCEDURE sp_obtener_rol_por_nombre(IN p_nombre VARCHAR(50))
BEGIN
  SELECT id FROM roles WHERE nombre = p_nombre LIMIT 1;
END$$

DELIMITER ;
