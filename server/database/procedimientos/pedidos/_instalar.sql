

SET NAMES utf8mb4;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_actualizar_estado_pedido_completo$$
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

DROP PROCEDURE IF EXISTS sp_bloquear_variantes_pedido$$

CREATE PROCEDURE sp_bloquear_variantes_pedido(IN p_ids JSON)
BEGIN
  SELECT
    v.id            AS id_variante,
    v.id_producto,
    v.talla,
    v.color,
    v.stock         AS stock_variante,
    v.activo,
    p.nombre,
    p.imagenes,
    p.precio,
    fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo
  FROM variantes_producto v
  INNER JOIN productos p ON p.id = v.id_producto
  WHERE v.id IN (
      SELECT CONVERT(j.id USING utf8mb4) COLLATE utf8mb4_spanish2_ci
      FROM JSON_TABLE(p_ids, '$[*]' COLUMNS (id CHAR(36) PATH '$')) j
    )
    AND p.estado = 'activo' AND v.activo = 1
  ORDER BY v.id
  FOR UPDATE;
END$$

DROP PROCEDURE IF EXISTS sp_contar_pedidos_filtro$$
CREATE PROCEDURE sp_contar_pedidos_filtro(IN p_estado VARCHAR(20))
BEGIN
  IF p_estado IS NULL THEN
    SELECT COUNT(*) AS total FROM pedidos;
  ELSE
    SELECT COUNT(*) AS total FROM pedidos WHERE estado_pedido = p_estado;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_crear_detalle_pedido$$
CREATE PROCEDURE sp_crear_detalle_pedido(
  IN p_id CHAR(36), IN p_id_pedido CHAR(36), IN p_id_producto CHAR(36),
  IN p_titulo VARCHAR(255), IN p_precio DECIMAL(10,2), IN p_cantidad INT,
  IN p_imagen JSON,
  IN p_id_variante CHAR(36), IN p_talla VARCHAR(20), IN p_color VARCHAR(40)
)
BEGIN

  INSERT INTO detalles_pedido
    (id, id_pedido, id_producto, titulo, precio, cantidad, imagen,
     id_variante, talla, color)
  VALUES
    (p_id, p_id_pedido, p_id_producto, p_titulo, p_precio, p_cantidad, p_imagen,
     p_id_variante, p_talla, p_color);
END$$

DROP PROCEDURE IF EXISTS sp_crear_pedido$$
CREATE PROCEDURE sp_crear_pedido(
  IN p_id CHAR(36), IN p_id_comprador CHAR(36), IN p_precio_total DECIMAL(10,2),
  IN p_impuesto DECIMAL(10,2), IN p_precio_envio DECIMAL(10,2),
  IN p_descuento DECIMAL(10,2), IN p_id_cupon CHAR(36), IN p_stock_reservado INT,
  IN p_estado_pedido VARCHAR(20)
)
BEGIN
  INSERT INTO pedidos (
    id, id_comprador, precio_total, impuesto, precio_envio,
    descuento, id_cupon, stock_reservado, estado_pedido
  ) VALUES (
    p_id, p_id_comprador, p_precio_total, p_impuesto, p_precio_envio,
    p_descuento, p_id_cupon, p_stock_reservado, p_estado_pedido
  );
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_pedido$$
CREATE PROCEDURE sp_eliminar_pedido(IN p_id_pedido CHAR(36))
BEGIN
  DELETE FROM pedidos WHERE id = p_id_pedido;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_liberar_variante$$

CREATE PROCEDURE sp_liberar_variante(
  IN p_id_variante CHAR(36),
  IN p_cantidad INT
)
BEGIN
  DECLARE v_id_producto CHAR(36);

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id_variante;

  IF v_id_producto IS NOT NULL AND p_cantidad > 0 THEN
    UPDATE variantes_producto
    SET stock = stock + p_cantidad, fecha_actualizacion = NOW()
    WHERE id = p_id_variante;

    UPDATE productos p
    SET p.stock = COALESCE((
          SELECT SUM(v.stock) FROM variantes_producto v
          WHERE v.id_producto = p.id AND v.activo = 1
        ), 0)
    WHERE p.id = v_id_producto;
  END IF;

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_listar_mis_pedidos_completos$$
CREATE PROCEDURE sp_listar_mis_pedidos_completos(IN p_id_usuario CHAR(36))
BEGIN
  SELECT
      p.id, p.id_comprador, p.precio_total, p.impuesto, p.precio_envio,
      p.descuento, p.id_cupon, MAX(c.codigo) AS codigo_cupon,
      p.estado_pedido, p.fecha_pagado, p.fecha_creado,
      COALESCE(JSON_ARRAYAGG(
          IF(pd.id IS NOT NULL,
              JSON_OBJECT('id', pd.id, 'id_pedido', pd.id_pedido, 'id_producto', pd.id_producto,
                  'id_variante', pd.id_variante, 'talla', pd.talla, 'color', pd.color,
                  'cantidad', pd.cantidad, 'precio', pd.precio, 'imagen', JSON_UNQUOTE(pd.imagen), 'titulo', pd.titulo),
              NULL)
      ), JSON_ARRAY()) AS detalles_pedido,
      JSON_OBJECT('nombre_completo', ie.nombre_completo, 'departamento', dep.nombre,
          'provincia', prov.nombre, 'distrito', dis.nombre, 'direccion', ie.direccion,
          'referencia', ie.referencia, 'codigo_postal', ie.codigo_postal, 'telefono', ie.telefono
      ) AS informacion_envio
  FROM pedidos p
  LEFT JOIN cupones c ON c.id = p.id_cupon
  LEFT JOIN detalles_pedido pd ON p.id = pd.id_pedido
  LEFT JOIN informacion_envio ie ON p.id = ie.id_pedido
  LEFT JOIN distritos dis ON dis.id = ie.id_distrito
  LEFT JOIN provincias prov ON prov.id = dis.id_provincia
  LEFT JOIN departamentos dep ON dep.id = prov.id_departamento
  WHERE p.id_comprador = p_id_usuario
  GROUP BY p.id, ie.id, dep.nombre, prov.nombre, dis.nombre
  ORDER BY p.fecha_creado DESC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_todos_pedidos_admin$$
CREATE PROCEDURE sp_listar_todos_pedidos_admin(IN p_estado VARCHAR(20), IN p_limit INT, IN p_offset INT)
BEGIN
  SELECT
      p.id, p.id_comprador, u.nombre AS nombre_usuario, u.email AS email_usuario,
      p.precio_total, p.impuesto, p.precio_envio, p.descuento, p.id_cupon,
      MAX(c.codigo) AS codigo_cupon, p.estado_pedido, p.fecha_pagado, p.fecha_creado,
      pg.intentos_pago, pg.ultimo_estado_pago, pg.id_cargo,
      COALESCE(JSON_ARRAYAGG(
          IF(pd.id IS NOT NULL,
              JSON_OBJECT('id', pd.id, 'id_pedido', pd.id_pedido, 'id_producto', pd.id_producto,
                  'id_variante', pd.id_variante, 'talla', pd.talla, 'color', pd.color,
                  'cantidad', pd.cantidad, 'precio', pd.precio, 'imagen', JSON_UNQUOTE(pd.imagen), 'titulo', pd.titulo),
              NULL)
      ), JSON_ARRAY()) AS detalles_pedido,
      JSON_OBJECT('nombre_completo', ie.nombre_completo, 'departamento', dep.nombre,
          'provincia', prov.nombre, 'distrito', dis.nombre, 'direccion', ie.direccion,
          'referencia', ie.referencia, 'codigo_postal', ie.codigo_postal, 'telefono', ie.telefono
      ) AS informacion_envio
  FROM pedidos p
  LEFT JOIN cupones c ON c.id = p.id_cupon
  LEFT JOIN usuarios u ON p.id_comprador = u.id
  LEFT JOIN detalles_pedido pd ON p.id = pd.id_pedido
  LEFT JOIN informacion_envio ie ON p.id = ie.id_pedido
  LEFT JOIN distritos dis ON dis.id = ie.id_distrito
  LEFT JOIN provincias prov ON prov.id = dis.id_provincia
  LEFT JOIN departamentos dep ON dep.id = prov.id_departamento
  LEFT JOIN (
      SELECT id_pedido,
          COUNT(*) AS intentos_pago,
          SUBSTRING_INDEX(GROUP_CONCAT(estado_pago ORDER BY fecha_creacion DESC), ',', 1) AS ultimo_estado_pago,
          SUBSTRING_INDEX(GROUP_CONCAT(id_intento_pago ORDER BY fecha_creacion DESC), ',', 1) AS id_cargo
      FROM pagos GROUP BY id_pedido
  ) pg ON pg.id_pedido = p.id
  WHERE (p_estado IS NULL OR p.estado_pedido = p_estado)
  GROUP BY p.id, u.id, ie.id, pg.intentos_pago, pg.ultimo_estado_pago, pg.id_cargo, dep.nombre, prov.nombre, dis.nombre
  ORDER BY p.fecha_creado DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_stock_reservado$$
CREATE PROCEDURE sp_marcar_stock_reservado(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET stock_reservado = 1 WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_detalles_pedido$$
CREATE PROCEDURE sp_obtener_detalles_pedido(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id_producto, id_variante, talla, color, cantidad, titulo, precio
  FROM detalles_pedido WHERE id_pedido = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_actualizado$$
CREATE PROCEDURE sp_obtener_pedido_actualizado(IN p_id_pedido CHAR(36))
BEGIN
  SELECT * FROM pedidos WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_completo_usuario$$
CREATE PROCEDURE sp_obtener_pedido_completo_usuario(IN p_id_pedido CHAR(36), IN p_id_usuario CHAR(36))
BEGIN
  SELECT
      p.id, p.id_comprador, p.precio_total, p.impuesto, p.precio_envio,
      p.descuento, p.id_cupon, MAX(c.codigo) AS codigo_cupon,
      p.estado_pedido, p.fecha_pagado, p.fecha_creado,
      COALESCE(JSON_ARRAYAGG(
          IF(pd.id IS NOT NULL,
              JSON_OBJECT('id', pd.id, 'id_pedido', pd.id_pedido, 'id_producto', pd.id_producto,
                  'id_variante', pd.id_variante, 'talla', pd.talla, 'color', pd.color,
                  'cantidad', pd.cantidad, 'precio', pd.precio, 'imagen', JSON_UNQUOTE(pd.imagen), 'titulo', pd.titulo),
              NULL)
      ), JSON_ARRAY()) AS detalles_pedido,
      JSON_OBJECT('nombre_completo', ie.nombre_completo, 'departamento', dep.nombre,
          'provincia', prov.nombre, 'distrito', dis.nombre, 'direccion', ie.direccion,
          'referencia', ie.referencia, 'codigo_postal', ie.codigo_postal, 'telefono', ie.telefono
      ) AS informacion_envio
  FROM pedidos p
  LEFT JOIN cupones c ON c.id = p.id_cupon
  LEFT JOIN detalles_pedido pd ON p.id = pd.id_pedido
  LEFT JOIN informacion_envio ie ON p.id = ie.id_pedido
  LEFT JOIN distritos dis ON dis.id = ie.id_distrito
  LEFT JOIN provincias prov ON prov.id = dis.id_provincia
  LEFT JOIN departamentos dep ON dep.id = prov.id_departamento
  WHERE p.id = p_id_pedido AND p.id_comprador = p_id_usuario
  GROUP BY p.id, p.id_comprador, p.precio_total, p.impuesto, p.precio_envio,
           p.descuento, p.id_cupon, p.estado_pedido, p.fecha_pagado, p.fecha_creado,
           ie.id, dep.nombre, prov.nombre, dis.nombre;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_estado$$
CREATE PROCEDURE sp_obtener_pedido_estado(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id, id_comprador, estado_pedido, fecha_pagado, fecha_entregado FROM pedidos WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_para_eliminar$$
CREATE PROCEDURE sp_obtener_pedido_para_eliminar(IN p_id_pedido CHAR(36))
BEGIN
  SELECT id, fecha_pagado FROM pedidos WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_reservar_variante$$

CREATE PROCEDURE sp_reservar_variante(
  IN p_id_variante CHAR(36),
  IN p_cantidad INT
)
BEGIN
  DECLARE v_id_producto CHAR(36);

  IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'CANTIDAD_INVALIDA';
  END IF;

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id_variante;

  IF v_id_producto IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTE_NO_ENCONTRADA';
  END IF;

  UPDATE variantes_producto
  SET stock = stock - p_cantidad,
      fecha_actualizacion = NOW()
  WHERE id = p_id_variante AND activo = 1 AND stock >= p_cantidad;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'STOCK_INSUFICIENTE';
  END IF;

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = v_id_producto;

  SELECT v.id, v.stock AS stock_variante, p.stock AS stock_producto
  FROM variantes_producto v JOIN productos p ON p.id = v.id_producto
  WHERE v.id = p_id_variante;
END$$

DROP PROCEDURE IF EXISTS sp_resumen_pedidos_admin$$
CREATE PROCEDURE sp_resumen_pedidos_admin()
BEGIN
  SELECT
      COALESCE(SUM(CASE WHEN fecha_pagado IS NOT NULL THEN precio_total ELSE 0 END), 0) AS monto_total,
      SUM(CASE WHEN fecha_pagado IS NOT NULL AND estado_pedido = 'Cancelado' THEN 1 ELSE 0 END) AS requieren_revision
  FROM pedidos;
END$$

DELIMITER ;
