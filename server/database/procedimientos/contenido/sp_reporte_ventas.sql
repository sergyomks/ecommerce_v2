

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_reporte_ventas;

DELIMITER $$

CREATE PROCEDURE sp_reporte_ventas(
  IN p_desde DATE,
  IN p_hasta DATE
)
BEGIN
  SELECT
    p.id,
    p.fecha_pagado,
    p.fecha_creado,
    p.estado_pedido,
    u.nombre                AS cliente,
    u.email                 AS correo,
    dep.nombre              AS departamento,
    prov.nombre             AS provincia,
    dis.nombre              AS distrito,
    ie.nombre_completo      AS destinatario,
    (p.precio_total - p.precio_envio + p.descuento) AS subtotal,
    p.descuento,
    c.codigo                AS codigo_cupon,
    p.precio_envio,
    p.precio_total,
    p.impuesto              AS igv_incluido,
    (SELECT COALESCE(SUM(pd.cantidad), 0)
     FROM detalles_pedido pd WHERE pd.id_pedido = p.id) AS unidades
  FROM pedidos p
  LEFT JOIN usuarios u          ON u.id   = p.id_comprador
  LEFT JOIN cupones c           ON c.id   = p.id_cupon
  LEFT JOIN informacion_envio ie ON ie.id_pedido = p.id
  LEFT JOIN distritos dis       ON dis.id  = ie.id_distrito
  LEFT JOIN provincias prov     ON prov.id = dis.id_provincia
  LEFT JOIN departamentos dep   ON dep.id  = prov.id_departamento
  WHERE p.fecha_pagado IS NOT NULL
    AND (p_desde IS NULL OR p.fecha_pagado >= p_desde)
    AND (p_hasta IS NULL OR p.fecha_pagado < DATE_ADD(p_hasta, INTERVAL 1 DAY))
  ORDER BY p.fecha_pagado ASC;
END$$

DELIMITER ;
