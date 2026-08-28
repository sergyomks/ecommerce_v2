

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_pago_fallido;

DELIMITER $$

CREATE PROCEDURE sp_marcar_pago_fallido(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Fallido' WHERE id_intento_pago = p_charge_id;
END$$

DELIMITER ;
