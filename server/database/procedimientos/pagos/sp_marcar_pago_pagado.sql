

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_marcar_pago_pagado;

DELIMITER $$

CREATE PROCEDURE sp_marcar_pago_pagado(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Pagado' WHERE id_intento_pago = p_charge_id;
END$$

DELIMITER ;
