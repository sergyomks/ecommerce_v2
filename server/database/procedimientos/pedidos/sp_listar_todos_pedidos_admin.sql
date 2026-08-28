

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_listar_todos_pedidos_admin;

DELIMITER $$

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

DELIMITER ;
