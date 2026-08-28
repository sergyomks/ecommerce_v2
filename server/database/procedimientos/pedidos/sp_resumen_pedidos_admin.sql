

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_resumen_pedidos_admin;

DELIMITER $$

CREATE PROCEDURE sp_resumen_pedidos_admin()
BEGIN
  SELECT
      COALESCE(SUM(CASE WHEN fecha_pagado IS NOT NULL THEN precio_total ELSE 0 END), 0) AS monto_total,
      SUM(CASE WHEN fecha_pagado IS NOT NULL AND estado_pedido = 'Cancelado' THEN 1 ELSE 0 END) AS requieren_revision
  FROM pedidos;
END$$

DELIMITER ;
