

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_departamentos;

DELIMITER $$

CREATE PROCEDURE sp_listar_departamentos()
BEGIN
  SELECT id, nombre, ubigeo FROM departamentos ORDER BY nombre ASC;
END$$

DELIMITER ;
