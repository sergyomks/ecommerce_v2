

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_pedido_pagado;

DELIMITER $$

CREATE PROCEDURE sp_marcar_pedido_pagado(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET fecha_pagado = NOW() WHERE id = p_id_pedido AND fecha_pagado IS NULL;
END$$

DELIMITER ;
