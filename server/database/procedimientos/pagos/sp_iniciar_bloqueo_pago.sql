

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_iniciar_bloqueo_pago;

DELIMITER $$

CREATE PROCEDURE sp_iniciar_bloqueo_pago(IN p_id_pedido CHAR(36), IN p_minutos INT)
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NOW()
  WHERE id = p_id_pedido
    AND fecha_pagado IS NULL
    AND estado_pedido <> 'Cancelado'
    AND (pago_iniciado_en IS NULL OR pago_iniciado_en < NOW() - INTERVAL p_minutos MINUTE);
END$$

DELIMITER ;
