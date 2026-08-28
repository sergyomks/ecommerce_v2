

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_categorias;

DELIMITER $$

CREATE PROCEDURE sp_listar_categorias(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT c.* FROM categorias c WHERE c.activo = 1 ORDER BY c.nombre ASC;
  ELSE
    SELECT c.* FROM categorias c ORDER BY c.nombre ASC;
  END IF;
END$$

DELIMITER ;
