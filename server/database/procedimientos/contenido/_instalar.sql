

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_agregar_wishlist$$
CREATE PROCEDURE sp_agregar_wishlist(IN p_id CHAR(36), IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  DECLARE v_activo INT;
  SELECT 1 INTO v_activo FROM productos WHERE id = p_id_producto AND estado = 'activo' LIMIT 1;

  IF v_activo IS NULL THEN
    SELECT 0 AS status, 'Producto no encontrado' AS message;
  ELSE
    BEGIN
      DECLARE CONTINUE HANDLER FOR 1062 SELECT 2 AS status, 'El producto ya está en tu lista de deseos' AS message;
      INSERT INTO lista_deseos (id, id_usuario, id_producto) VALUES (p_id, p_id_usuario, p_id_producto);
      SELECT 1 AS status, 'Producto agregado a la lista de deseos' AS message;
    END;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_contar_mensajes_contacto$$
CREATE PROCEDURE sp_contar_mensajes_contacto()
BEGIN
  SELECT COUNT(*) AS total FROM mensajes_contacto;
END$$

DROP PROCEDURE IF EXISTS sp_crear_mensaje_contacto$$
CREATE PROCEDURE sp_crear_mensaje_contacto(
  IN p_id CHAR(36), IN p_nombre VARCHAR(255), IN p_email VARCHAR(255),
  IN p_asunto VARCHAR(255), IN p_mensaje TEXT
)
BEGIN
  INSERT INTO mensajes_contacto (id, nombre, email, asunto, mensaje)
  VALUES (p_id, p_nombre, p_email, p_asunto, p_mensaje);
END$$

DROP PROCEDURE IF EXISTS sp_dashboard_panel$$
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

DROP PROCEDURE IF EXISTS sp_eliminar_mensaje_contacto$$
CREATE PROCEDURE sp_eliminar_mensaje_contacto(IN p_id CHAR(36))
BEGIN
  DELETE FROM mensajes_contacto WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_wishlist$$
CREATE PROCEDURE sp_eliminar_wishlist(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  DELETE FROM lista_deseos WHERE id_usuario = p_id_usuario AND id_producto = p_id_producto;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_listar_mensajes_contacto$$
CREATE PROCEDURE sp_listar_mensajes_contacto(IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT id, nombre, email, asunto, mensaje, leido, fecha_creacion
  FROM mensajes_contacto
  ORDER BY fecha_creacion DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_listar_wishlist$$
CREATE PROCEDURE sp_listar_wishlist(IN p_id_usuario CHAR(36))
BEGIN
  SELECT
     w.id AS wishlist_id,
     w.fecha_creacion AS agregado_en,
     p.id,
     p.nombre,
     p.descripcion,
     p.precio,
     c.nombre AS categoria,
     p.stock,
     p.imagenes,
     p.calificaciones
   FROM lista_deseos w
   INNER JOIN productos p ON p.id = w.id_producto
   INNER JOIN categorias c ON c.id = p.id_categoria
   WHERE w.id_usuario = p_id_usuario AND p.estado = 'activo'
   ORDER BY w.fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_mensaje_leido$$
CREATE PROCEDURE sp_marcar_mensaje_leido(IN p_id CHAR(36))
BEGIN
  UPDATE mensajes_contacto SET leido = 1 WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_reporte_ventas$$

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

DROP PROCEDURE IF EXISTS sp_verificar_wishlist$$
CREATE PROCEDURE sp_verificar_wishlist(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  SELECT id FROM lista_deseos WHERE id_usuario = p_id_usuario AND id_producto = p_id_producto LIMIT 1;
END$$

DELIMITER ;
