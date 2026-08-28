

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_cupones;

DELIMITER $$

CREATE PROCEDURE sp_listar_cupones()
BEGIN
  SELECT * FROM cupones ORDER BY fecha_creacion DESC;
END$$

DELIMITER ;
