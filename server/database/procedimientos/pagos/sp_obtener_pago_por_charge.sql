

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pago_por_charge;

DELIMITER $$

CREATE PROCEDURE sp_obtener_pago_por_charge(IN p_charge_id VARCHAR(255))
BEGIN
  SELECT id, id_pedido, estado_pago FROM pagos WHERE id_intento_pago = p_charge_id;
END$$

DELIMITER ;
