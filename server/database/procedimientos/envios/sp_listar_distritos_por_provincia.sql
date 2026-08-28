

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_distritos_por_provincia;

DELIMITER $$

CREATE PROCEDURE sp_listar_distritos_por_provincia(IN p_id_provincia INT)
BEGIN
  SELECT id, nombre, id_provincia, ubigeo FROM distritos WHERE id_provincia = p_id_provincia ORDER BY nombre ASC;
END$$

DELIMITER ;
