

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_id;

DELIMITER $$

CREATE PROCEDURE sp_obtener_distrito_por_id(IN p_id INT)
BEGIN
  SELECT di.id, di.nombre AS distrito, di.ubigeo,
         pr.id AS id_provincia, pr.nombre AS provincia,
         de.id AS id_departamento, de.nombre AS departamento
  FROM distritos di
  INNER JOIN provincias pr ON pr.id = di.id_provincia
  INNER JOIN departamentos de ON de.id = pr.id_departamento
  WHERE di.id = p_id
  LIMIT 1;
END$$

DELIMITER ;
