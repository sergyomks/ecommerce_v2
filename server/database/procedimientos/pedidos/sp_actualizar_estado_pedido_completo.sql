

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_actualizar_estado_pedido_completo;

DELIMITER $$

CREATE PROCEDURE sp_actualizar_estado_pedido_completo(
  IN p_id_pedido CHAR(36), IN p_estado VARCHAR(20), IN p_set_entregado INT
)
BEGIN
  IF p_set_entregado = 1 THEN
    UPDATE pedidos SET estado_pedido = p_estado, fecha_entregado = NOW(), fecha_actualizado = NOW() WHERE id = p_id_pedido;
  ELSE
    UPDATE pedidos SET estado_pedido = p_estado, fecha_actualizado = NOW() WHERE id = p_id_pedido;
  END IF;
END$$

DELIMITER ;
