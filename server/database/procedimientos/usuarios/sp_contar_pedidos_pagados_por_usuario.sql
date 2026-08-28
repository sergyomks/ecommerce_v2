

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_contar_pedidos_pagados_por_usuario;

DELIMITER $$

CREATE PROCEDURE sp_contar_pedidos_pagados_por_usuario(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_comprador = p_id_usuario AND fecha_pagado IS NOT NULL;
END$$

DELIMITER ;
