

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_pedidos_filtro;

DELIMITER $$

CREATE PROCEDURE sp_contar_pedidos_filtro(IN p_estado VARCHAR(20))
BEGIN
  IF p_estado IS NULL THEN
    SELECT COUNT(*) AS total FROM pedidos;
  ELSE
    SELECT COUNT(*) AS total FROM pedidos WHERE estado_pedido = p_estado;
  END IF;
END$$

DELIMITER ;
