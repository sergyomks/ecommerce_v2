

SET NAMES utf8mb4;

DROP PROCEDURE IF EXISTS sp_obtener_pedido_completo_usuario;

DELIMITER $$

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

DELIMITER ;
