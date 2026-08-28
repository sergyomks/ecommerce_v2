

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_liberar_bloqueo_pago;

DELIMITER $$

CREATE PROCEDURE sp_liberar_bloqueo_pago(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NULL WHERE id = p_id_pedido;
END$$

DELIMITER ;
