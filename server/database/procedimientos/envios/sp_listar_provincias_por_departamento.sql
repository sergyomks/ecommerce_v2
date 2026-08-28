

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_provincias_por_departamento;

DELIMITER $$

CREATE PROCEDURE sp_listar_provincias_por_departamento(IN p_id_departamento INT)
BEGIN
  SELECT id, nombre, id_departamento, ubigeo FROM provincias WHERE id_departamento = p_id_departamento ORDER BY nombre ASC;
END$$

DELIMITER ;
