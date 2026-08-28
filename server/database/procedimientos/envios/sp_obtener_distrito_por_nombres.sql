

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_nombres;

DELIMITER $$

CREATE PROCEDURE sp_obtener_distrito_por_nombres(
  IN p_distrito VARCHAR(100), IN p_provincia VARCHAR(100), IN p_departamento VARCHAR(100)
)
BEGIN
  SELECT di.id
  FROM distritos di
  JOIN provincias pr ON di.id_provincia = pr.id
  JOIN departamentos de ON pr.id_departamento = de.id
  WHERE di.nombre = p_distrito COLLATE utf8mb4_spanish2_ci
    AND pr.nombre = p_provincia COLLATE utf8mb4_spanish2_ci
    AND de.nombre = p_departamento COLLATE utf8mb4_spanish2_ci
  LIMIT 1;
END$$

DELIMITER ;
