

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_dashboard_panel;

DELIMITER $$

CREATE PROCEDURE sp_dashboard_panel(
  IN p_fecha_hoy DATE,
  IN p_fecha_ayer DATE,
  IN p_inicio_mes_actual DATETIME,
  IN p_inicio_mes_siguiente DATETIME,
  IN p_inicio_mes_anterior DATETIME
)
BEGIN

  SELECT COALESCE(SUM(precio_total), 0) AS total_ingreso FROM pedidos WHERE fecha_pagado IS NOT NULL;

  SELECT COUNT(*) AS total_usuarios FROM usuarios u INNER JOIN roles r ON r.id = u.id_rol WHERE r.nombre = 'Usuario';

  SELECT estado_pedido, COUNT(*) AS cantidad FROM pedidos WHERE fecha_pagado IS NOT NULL GROUP BY estado_pedido;

  SELECT COALESCE(SUM(precio_total), 0) AS ingreso_hoy FROM pedidos WHERE DATE(fecha_creado) = p_fecha_hoy AND fecha_pagado IS NOT NULL;

  SELECT COALESCE(SUM(precio_total), 0) AS ingreso_ayer FROM pedidos WHERE DATE(fecha_creado) = p_fecha_ayer AND fecha_pagado IS NOT NULL;

  SELECT
    DATE_FORMAT(fecha_creado, '%b %Y') AS month,
    DATE_FORMAT(fecha_creado, '%Y-%m-01') as date,
    SUM(precio_total) as totalventas
  FROM pedidos WHERE fecha_pagado IS NOT NULL
  GROUP BY DATE_FORMAT(fecha_creado, '%Y-%m-01'), DATE_FORMAT(fecha_creado, '%b %Y')
  ORDER BY DATE_FORMAT(fecha_creado, '%Y-%m-01') ASC;

  SELECT p.id, p.nombre, p.imagenes AS imagen, COALESCE(s.nombre, c.nombre) AS categoria, p.calificaciones, SUM(pd.cantidad) AS total_vendido
  FROM detalles_pedido pd
  JOIN productos p ON p.id = pd.id_producto
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  JOIN pedidos o ON o.id = pd.id_pedido
  WHERE o.fecha_pagado IS NOT NULL
  GROUP BY p.id, p.nombre, p.imagenes, COALESCE(s.nombre, c.nombre), p.calificaciones
  ORDER BY total_vendido DESC
  LIMIT 5;

  SELECT COALESCE(SUM(precio_total), 0) AS total FROM pedidos WHERE fecha_pagado IS NOT NULL AND fecha_creado >= p_inicio_mes_actual AND fecha_creado < p_inicio_mes_siguiente;

  SELECT nombre, stock FROM productos WHERE stock <= 5;

  SELECT COALESCE(SUM(precio_total), 0) AS total FROM pedidos WHERE fecha_pagado IS NOT NULL AND fecha_creado >= p_inicio_mes_anterior AND fecha_creado < p_inicio_mes_actual;

  SELECT COUNT(*) AS total_nuevos FROM usuarios u INNER JOIN roles r ON r.id = u.id_rol WHERE u.fecha_creacion >= p_inicio_mes_actual AND r.nombre = 'Usuario';
END$$

DELIMITER ;
