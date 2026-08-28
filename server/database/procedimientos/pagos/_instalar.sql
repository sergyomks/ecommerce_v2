

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_iniciar_bloqueo_pago$$
CREATE PROCEDURE sp_iniciar_bloqueo_pago(IN p_id_pedido CHAR(36), IN p_minutos INT)
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NOW()
  WHERE id = p_id_pedido
    AND fecha_pagado IS NULL
    AND estado_pedido <> 'Cancelado'
    AND (pago_iniciado_en IS NULL OR pago_iniciado_en < NOW() - INTERVAL p_minutos MINUTE);
END$$

DROP PROCEDURE IF EXISTS sp_liberar_bloqueo_pago$$
CREATE PROCEDURE sp_liberar_bloqueo_pago(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NULL WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pago_fallido$$
CREATE PROCEDURE sp_marcar_pago_fallido(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Fallido' WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pago_pagado$$
CREATE PROCEDURE sp_marcar_pago_pagado(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Pagado' WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pedido_pagado$$
CREATE PROCEDURE sp_marcar_pedido_pagado(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET fecha_pagado = NOW() WHERE id = p_id_pedido AND fecha_pagado IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pago_por_charge$$
CREATE PROCEDURE sp_obtener_pago_por_charge(IN p_charge_id VARCHAR(255))
BEGIN
  SELECT id, id_pedido, estado_pago FROM pagos WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_para_pago$$
CREATE PROCEDURE sp_obtener_pedido_para_pago(IN p_id_pedido CHAR(36), IN p_id_comprador CHAR(36))
BEGIN
  SELECT id, precio_total, fecha_pagado, stock_reservado, estado_pedido
  FROM pedidos WHERE id = p_id_pedido AND id_comprador = p_id_comprador;
END$$

DROP PROCEDURE IF EXISTS sp_registrar_webhook$$
CREATE PROCEDURE sp_registrar_webhook(
  IN p_id CHAR(36), IN p_id_evento VARCHAR(255), IN p_tipo VARCHAR(100), IN p_id_cargo VARCHAR(255)
)
BEGIN
  INSERT INTO webhooks_procesados (id, id_evento, tipo_evento, id_cargo)
  VALUES (p_id, p_id_evento, p_tipo, p_id_cargo);
END$$

DROP PROCEDURE IF EXISTS sp_verificar_webhook_procesado$$
CREATE PROCEDURE sp_verificar_webhook_procesado(IN p_id_evento VARCHAR(255))
BEGIN
  SELECT id FROM webhooks_procesados WHERE id_evento = p_id_evento LIMIT 1;
END$$

DELIMITER ;
