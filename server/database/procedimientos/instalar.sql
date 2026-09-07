

SET NAMES utf8mb4;

DELIMITER $$

DROP FUNCTION IF EXISTS fn_precio_efectivo$$

CREATE FUNCTION fn_precio_efectivo(
  p_precio        DECIMAL(10,2),
  p_precio_oferta DECIMAL(10,2),
  p_inicio        DATETIME,
  p_fin           DATETIME,
  p_ahora         DATETIME
) RETURNS DECIMAL(10,2)
DETERMINISTIC
NO SQL
BEGIN
  IF p_precio_oferta IS NULL
     OR p_precio_oferta <= 0
     OR p_precio_oferta >= p_precio
     OR (p_inicio IS NOT NULL AND p_ahora < p_inicio)
     OR (p_fin    IS NOT NULL AND p_ahora > p_fin)
  THEN
    RETURN p_precio;
  END IF;

  RETURN p_precio_oferta;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_categoria$$
CREATE PROCEDURE sp_actualizar_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE categorias
  SET nombre = p_nombre, slug = p_slug, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_oferta_producto$$

CREATE PROCEDURE sp_actualizar_oferta_producto(
  IN p_id CHAR(36),
  IN p_precio_oferta DECIMAL(10,2),
  IN p_inicio DATETIME,
  IN p_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL AND p_fin IS NOT NULL
     AND p_inicio IS NOT NULL AND p_fin < p_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET precio_oferta = p_precio_oferta,
      oferta_inicio = IF(p_precio_oferta IS NULL, NULL, p_inicio),
      oferta_fin    = IF(p_precio_oferta IS NULL, NULL, p_fin)
  WHERE id = p_id
    AND estado = 'activo'
    AND (p_precio_oferta IS NULL OR (p_precio_oferta > 0 AND p_precio_oferta < precio));

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_NO_APLICABLE';
  END IF;

  SELECT id, precio, precio_oferta, oferta_inicio, oferta_fin,
         fn_precio_efectivo(precio, precio_oferta, oferta_inicio, oferta_fin, NOW()) AS precio_efectivo
  FROM productos WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_producto_completo$$
CREATE PROCEDURE sp_actualizar_producto_completo(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON,
  IN p_precio_oferta DECIMAL(10,2),
  IN p_oferta_inicio DATETIME,
  IN p_oferta_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL
     AND (p_precio_oferta <= 0 OR p_precio_oferta >= p_precio) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PRECIO_OFERTA_INVALIDO';
  END IF;

  IF p_precio_oferta IS NOT NULL
     AND p_oferta_inicio IS NOT NULL
     AND p_oferta_fin IS NOT NULL
     AND p_oferta_fin < p_oferta_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  UPDATE productos
  SET nombre = p_nombre, descripcion = p_descripcion, precio = p_precio,
      id_categoria = p_id_categoria, id_subcategoria = p_id_subcategoria,
      stock = p_stock, imagenes = p_imagenes,
      precio_oferta = p_precio_oferta,
      oferta_inicio = p_oferta_inicio,
      oferta_fin = p_oferta_fin
  WHERE id = p_id;

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
         fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
         (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_subcategoria$$
CREATE PROCEDURE sp_actualizar_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  UPDATE subcategorias
  SET nombre = p_nombre, slug = p_slug, id_categoria = p_id_categoria, imagen = p_imagen, activo = p_activo, fecha_actualizacion = NOW()
  WHERE id = p_id;

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_buscar_productos$$
CREATE PROCEDURE sp_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255),
  IN p_limit INT,
  IN p_offset INT
)
BEGIN
  SELECT
      p.*,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria,
      c.nombre AS categoria_padre,
      COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'))
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT p_limit OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_buscar_productos_ia$$
CREATE PROCEDURE sp_buscar_productos_ia(IN p_regex_keywords TEXT)
BEGIN
  SELECT p.*, c.nombre AS categoria
  FROM productos p
  INNER JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
  AND (p.nombre REGEXP p_regex_keywords OR p.descripcion REGEXP p_regex_keywords OR c.nombre REGEXP p_regex_keywords)
  LIMIT 200;
END$$

DROP PROCEDURE IF EXISTS sp_contar_buscar_productos$$
CREATE PROCEDURE sp_contar_buscar_productos(
  IN p_disponibilidad VARCHAR(20),
  IN p_min_precio DECIMAL(10,2),
  IN p_max_precio DECIMAL(10,2),
  IN p_categoria VARCHAR(255),
  IN p_calificaciones DECIMAL(3,2),
  IN p_buscar VARCHAR(255)
)
BEGIN
  SELECT COUNT(*) as total
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.estado = 'activo'
    AND (p_disponibilidad IS NULL OR
         (p_disponibilidad = 'en_stock' AND p.stock > 5) OR
         (p_disponibilidad = 'limitado' AND p.stock > 0 AND p.stock <= 5) OR
         (p_disponibilidad = 'agotado' AND p.stock = 0))
    AND (p_min_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) >= p_min_precio)
    AND (p_max_precio IS NULL OR fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) <= p_max_precio)
    AND (p_categoria IS NULL OR c.nombre = p_categoria OR s.nombre = p_categoria OR c.id = p_categoria OR s.id = p_categoria)
    AND (p_calificaciones IS NULL OR p.calificaciones >= p_calificaciones)
    AND (p_buscar IS NULL OR p.nombre LIKE CONCAT('%', p_buscar, '%') OR p.descripcion LIKE CONCAT('%', p_buscar, '%'));
END$$

DROP PROCEDURE IF EXISTS sp_contar_productos_por_categoria$$
CREATE PROCEDURE sp_contar_productos_por_categoria(IN p_id_categoria CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM productos WHERE id_categoria = p_id_categoria AND estado = 'activo';
END$$

DROP PROCEDURE IF EXISTS sp_contar_subcategorias_por_categoria$$
CREATE PROCEDURE sp_contar_subcategorias_por_categoria(IN p_id_categoria CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM subcategorias WHERE id_categoria = p_id_categoria;
END$$

DROP PROCEDURE IF EXISTS sp_crear_categoria$$
CREATE PROCEDURE sp_crear_categoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_imagen JSON
)
BEGIN
  INSERT INTO categorias (id, nombre, slug, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_imagen, 1);

  SELECT c.* FROM categorias c WHERE c.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_producto$$
CREATE PROCEDURE sp_crear_producto(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(255),
  IN p_descripcion TEXT,
  IN p_precio DECIMAL(10,2),
  IN p_id_categoria CHAR(36),
  IN p_id_subcategoria CHAR(36),
  IN p_stock INT,
  IN p_imagenes JSON,
  IN p_creado_por CHAR(36),
  IN p_precio_oferta DECIMAL(10,2),
  IN p_oferta_inicio DATETIME,
  IN p_oferta_fin DATETIME
)
BEGIN
  IF p_precio_oferta IS NOT NULL
     AND (p_precio_oferta <= 0 OR p_precio_oferta >= p_precio) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'PRECIO_OFERTA_INVALIDO';
  END IF;

  IF p_precio_oferta IS NOT NULL
     AND p_oferta_inicio IS NOT NULL
     AND p_oferta_fin IS NOT NULL
     AND p_oferta_fin < p_oferta_inicio THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'OFERTA_FECHAS_INVALIDAS';
  END IF;

  INSERT INTO productos (
    id, nombre, descripcion, precio, id_categoria, id_subcategoria, stock, imagenes, creado_por,
    precio_oferta, oferta_inicio, oferta_fin
  )
  VALUES (
    p_id, p_nombre, p_descripcion, p_precio, p_id_categoria, p_id_subcategoria, p_stock, p_imagenes, p_creado_por,
    p_precio_oferta, p_oferta_inicio, p_oferta_fin
  );

  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
         fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
         (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_subcategoria$$
CREATE PROCEDURE sp_crear_subcategoria(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_slug VARCHAR(120),
  IN p_id_categoria CHAR(36),
  IN p_imagen JSON,
  IN p_activo INT
)
BEGIN
  INSERT INTO subcategorias (id, nombre, slug, id_categoria, imagen, activo)
  VALUES (p_id, p_nombre, p_slug, p_id_categoria, p_imagen, p_activo);

  SELECT s.*, c.nombre AS categoria_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE s.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_desactivar_categoria$$
CREATE PROCEDURE sp_desactivar_categoria(IN p_id CHAR(36))
BEGIN
  UPDATE categorias SET activo = 0, fecha_actualizacion = NOW() WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_categoria$$
CREATE PROCEDURE sp_eliminar_categoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM categorias WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_resena$$
CREATE PROCEDURE sp_eliminar_resena(IN p_id_producto CHAR(36), IN p_id_usuario CHAR(36))
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    DELETE FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

    SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
    UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;
  END IF;

  SELECT v_existe AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_subcategoria$$
CREATE PROCEDURE sp_eliminar_subcategoria(IN p_id CHAR(36))
BEGIN
  DELETE FROM subcategorias WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_variante$$

CREATE PROCEDURE sp_eliminar_variante(IN p_id CHAR(36))
BEGIN
  DECLARE v_id_producto CHAR(36);
  DECLARE v_con_pedidos INT DEFAULT 0;

  SELECT id_producto INTO v_id_producto
  FROM variantes_producto WHERE id = p_id;

  IF v_id_producto IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTE_NO_ENCONTRADA';
  END IF;

  SELECT COUNT(*) INTO v_con_pedidos
  FROM detalles_pedido WHERE id_variante = p_id;

  IF v_con_pedidos > 0 THEN
    UPDATE variantes_producto
    SET activo = 0, stock = 0, fecha_actualizacion = NOW()
    WHERE id = p_id;
  ELSE
    DELETE FROM variantes_producto WHERE id = p_id;
  END IF;

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = v_id_producto;

  SELECT v_con_pedidos > 0 AS desactivada, v_con_pedidos AS pedidos_afectados;
END$$

DROP PROCEDURE IF EXISTS sp_guardar_variantes$$

CREATE PROCEDURE sp_guardar_variantes(
  IN p_id_producto CHAR(36),
  IN p_variantes JSON
)
BEGIN
  IF JSON_LENGTH(p_variantes) IS NULL OR JSON_LENGTH(p_variantes) = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VARIANTES_VACIAS';
  END IF;

  INSERT INTO variantes_producto
    (id, id_producto, talla, color, color_hex, sku, stock, activo)
  SELECT
    UUID(), p_id_producto, j.talla, j.color,
    NULLIF(j.color_hex, ''), NULLIF(j.sku, ''),
    GREATEST(COALESCE(j.stock, 0), 0), 1
  FROM JSON_TABLE(p_variantes, '$[*]' COLUMNS (
    talla     VARCHAR(20) PATH '$.talla',
    color     VARCHAR(40) PATH '$.color',
    color_hex VARCHAR(7)  PATH '$.color_hex',
    sku       VARCHAR(60) PATH '$.sku',
    stock     INT         PATH '$.stock'
  )) j
  WHERE j.talla IS NOT NULL AND j.color IS NOT NULL
  ON DUPLICATE KEY UPDATE
    stock               = VALUES(stock),
    color_hex           = VALUES(color_hex),
    sku                 = VALUES(sku),
    activo              = 1,
    fecha_actualizacion = NOW();

  UPDATE productos p
  SET p.stock = COALESCE((
        SELECT SUM(v.stock) FROM variantes_producto v
        WHERE v.id_producto = p.id AND v.activo = 1
      ), 0)
  WHERE p.id = p_id_producto;

  SELECT id, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_categorias$$
CREATE PROCEDURE sp_listar_categorias(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT c.* FROM categorias c WHERE c.activo = 1 ORDER BY c.nombre ASC;
  ELSE
    SELECT c.* FROM categorias c ORDER BY c.nombre ASC;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_listar_subcategorias$$
CREATE PROCEDURE sp_listar_subcategorias(IN p_categoria_id CHAR(36), IN p_solo_activas INT)
BEGIN
  SELECT s.*, c.nombre AS categoria_padre_nombre
  FROM subcategorias s
  INNER JOIN categorias c ON c.id = s.id_categoria
  WHERE (p_categoria_id IS NULL OR s.id_categoria = p_categoria_id)
    AND (p_solo_activas = 0 OR (s.activo = 1 AND c.activo = 1))
  ORDER BY c.nombre ASC, s.nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_variantes$$

CREATE PROCEDURE sp_listar_variantes(
  IN p_id_producto CHAR(36),
  IN p_solo_disponibles INT
)
BEGIN
  SELECT id, id_producto, talla, color, color_hex, sku, stock, activo
  FROM variantes_producto
  WHERE id_producto = p_id_producto
    AND (p_solo_disponibles = 0 OR activo = 1)
  ORDER BY color ASC, FIELD(talla, 'XS','S','M','L','XL','XXL'), talla ASC;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_producto_eliminado$$
CREATE PROCEDURE sp_marcar_producto_eliminado(IN p_id CHAR(36))
BEGIN
  UPDATE productos SET estado = 'eliminado', fecha_eliminacion = NOW() WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_categoria_o_subcategoria$$
CREATE PROCEDURE sp_obtener_categoria_o_subcategoria(IN p_criterio VARCHAR(255))
BEGIN
  SELECT id, id_categoria AS id_categoria_padre, 'subcategoria' AS tipo
  FROM subcategorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;

  SELECT id, NULL AS id_categoria_padre, 'categoria' AS tipo
  FROM categorias
  WHERE (nombre = p_criterio OR id = p_criterio) AND activo = 1
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_categoria_por_id$$
CREATE PROCEDURE sp_obtener_categoria_por_id(IN p_id CHAR(36))
BEGIN
  SELECT * FROM categorias WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_detalle_producto$$
CREATE PROCEDURE sp_obtener_detalle_producto(IN p_id CHAR(36))
BEGIN
  SELECT
      p.id, p.nombre, p.descripcion, p.precio,
      p.precio_oferta, p.oferta_inicio, p.oferta_fin,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta,
      COALESCE(s.nombre, c.nombre) AS categoria,
      s.nombre AS subcategoria, c.nombre AS categoria_padre,
      p.calificaciones, p.imagenes, p.stock, p.estado, p.fecha_creacion, p.creado_por,
      COUNT(DISTINCT r.id) AS review_count,
      ROUND(AVG(r.calificacion), 2) AS promedio_calificacion,
      u.nombre AS vendedor_nombre, u.email AS vendedor_email
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  LEFT JOIN usuarios u ON p.creado_por = u.id
  WHERE p.id = p_id AND p.estado = 'activo'
  GROUP BY p.id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_nuevos_productos$$
CREATE PROCEDURE sp_obtener_nuevos_productos()
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.fecha_creacion >= NOW() - INTERVAL 30 DAY AND p.estado = 'activo'
  GROUP BY p.id
  ORDER BY p.fecha_creacion DESC
  LIMIT 8;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_producto_por_id$$
CREATE PROCEDURE sp_obtener_producto_por_id(IN p_id CHAR(36))
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, s.nombre AS subcategoria, c.nombre AS categoria_padre,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  WHERE p.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_resenas_producto$$
CREATE PROCEDURE sp_obtener_resenas_producto(IN p_id CHAR(36))
BEGIN
  SELECT r.id, r.id_usuario, r.calificacion, r.comentario, r.fecha_creacion, u.nombre AS usuario_nombre, u.imagen AS usuario_imagen
  FROM resenas_productos r
  LEFT JOIN usuarios u ON r.id_usuario = u.id
  WHERE r.id_producto = p_id
  ORDER BY r.fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_subcategoria_por_id$$
CREATE PROCEDURE sp_obtener_subcategoria_por_id(IN p_id CHAR(36))
BEGIN
  SELECT * FROM subcategorias WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_top_calificados$$
CREATE PROCEDURE sp_obtener_top_calificados()
BEGIN
  SELECT p.*, COALESCE(s.nombre, c.nombre) AS categoria, COUNT(r.id) AS review_count,
      fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) AS precio_efectivo,
      (fn_precio_efectivo(p.precio, p.precio_oferta, p.oferta_inicio, p.oferta_fin, NOW()) < p.precio) AS en_oferta
  FROM productos p
  LEFT JOIN subcategorias s ON s.id = p.id_subcategoria
  LEFT JOIN categorias c ON c.id = p.id_categoria
  LEFT JOIN resenas_productos r ON p.id = r.id_producto
  WHERE p.calificaciones >= 4.5 AND p.estado = 'activo'
  GROUP BY p.id
  ORDER BY p.calificaciones DESC, p.fecha_creacion DESC
  LIMIT 8;
END$$

DROP PROCEDURE IF EXISTS sp_publicar_resena$$
CREATE PROCEDURE sp_publicar_resena(
  IN p_id_resena CHAR(36),
  IN p_id_producto CHAR(36),
  IN p_id_usuario CHAR(36),
  IN p_calificacion INT,
  IN p_comentario TEXT
)
BEGIN
  DECLARE v_existe INT;
  DECLARE v_promedio DECIMAL(3,2);

  SELECT COUNT(id) INTO v_existe FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;

  IF v_existe > 0 THEN
    UPDATE resenas_productos SET calificacion = p_calificacion, comentario = p_comentario WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario;
  ELSE
    INSERT INTO resenas_productos (id, id_producto, id_usuario, calificacion, comentario) VALUES (p_id_resena, p_id_producto, p_id_usuario, p_calificacion, p_comentario);
  END IF;

  SELECT ROUND(AVG(calificacion), 2) INTO v_promedio FROM resenas_productos WHERE id_producto = p_id_producto;
  UPDATE productos SET calificaciones = COALESCE(v_promedio, 0) WHERE id = p_id_producto;

  SELECT * FROM resenas_productos WHERE id_producto = p_id_producto AND id_usuario = p_id_usuario LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_resolver_categoria$$
CREATE PROCEDURE sp_resolver_categoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id FROM categorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_resolver_subcategoria$$
CREATE PROCEDURE sp_resolver_subcategoria(IN p_valor VARCHAR(255))
BEGIN
  SELECT id, id_categoria FROM subcategorias WHERE (nombre = p_valor OR id = p_valor) AND activo = 1 LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_categoria_duplicada$$
CREATE PROCEDURE sp_verificar_categoria_duplicada(IN p_nombre VARCHAR(100), IN p_slug VARCHAR(120), IN p_id CHAR(36))
BEGIN
  IF p_id IS NULL THEN
    SELECT id FROM categorias WHERE (nombre = p_nombre OR slug = p_slug) LIMIT 1;
  ELSE
    SELECT id FROM categorias WHERE (nombre = p_nombre OR slug = p_slug) AND id <> p_id LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_compra_producto$$
CREATE PROCEDURE sp_verificar_compra_producto(IN p_id_usuario CHAR(36), IN p_id_producto CHAR(36))
BEGIN
  SELECT dp.id_producto
  FROM detalles_pedido dp
  JOIN pedidos p ON p.id = dp.id_pedido
  WHERE p.id_comprador = p_id_usuario
  AND dp.id_producto = p_id_producto
  AND p.fecha_pagado IS NOT NULL
  AND p.estado_pedido <> 'Cancelado'
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_cuadre_stock$$

CREATE PROCEDURE sp_verificar_cuadre_stock()
BEGIN
  SELECT
    p.id,
    p.nombre,
    p.stock                          AS total_guardado,
    COALESCE(SUM(v.stock), 0)        AS suma_variantes,
    p.stock - COALESCE(SUM(v.stock), 0) AS diferencia
  FROM productos p
  LEFT JOIN variantes_producto v
    ON v.id_producto = p.id AND v.activo = 1
  WHERE p.estado = 'activo'
  GROUP BY p.id, p.nombre, p.stock
  HAVING p.stock <> COALESCE(SUM(v.stock), 0);
END$$

DROP PROCEDURE IF EXISTS sp_verificar_pedidos_producto$$
CREATE PROCEDURE sp_verificar_pedidos_producto(IN p_id CHAR(36))
BEGIN
  SELECT 1 AS tiene_pedidos FROM detalles_pedido WHERE id_producto = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_subcategoria_duplicada$$
CREATE PROCEDURE sp_verificar_subcategoria_duplicada(IN p_nombre VARCHAR(100), IN p_slug VARCHAR(120), IN p_id CHAR(36))
BEGIN
  IF p_id IS NULL THEN
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) LIMIT 1;
  ELSE
    SELECT id FROM subcategorias WHERE (nombre = p_nombre OR slug = p_slug) AND id <> p_id LIMIT 1;
  END IF;
END$$

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

DROP PROCEDURE IF EXISTS sp_actualizar_cupon$$
CREATE PROCEDURE sp_actualizar_cupon(
  IN p_id CHAR(36), IN p_codigo VARCHAR(50), IN p_tipo VARCHAR(20), IN p_valor DECIMAL(10,2),
  IN p_minimo_compra DECIMAL(10,2), IN p_usos_max INT, IN p_fecha_inicio DATETIME,
  IN p_fecha_fin DATETIME, IN p_activo INT
)
BEGIN
  UPDATE cupones
  SET codigo = p_codigo, tipo = p_tipo, valor = p_valor,
      minimo_compra = p_minimo_compra, usos_maximos = p_usos_max,
      fecha_inicio = p_fecha_inicio, fecha_fin = p_fecha_fin, activo = p_activo
  WHERE id = p_id;

  SELECT * FROM cupones WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_contar_usos_cupon$$
CREATE PROCEDURE sp_contar_usos_cupon(IN p_id CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_cupon = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_cupon$$
CREATE PROCEDURE sp_crear_cupon(
  IN p_id CHAR(36), IN p_codigo VARCHAR(50), IN p_tipo VARCHAR(20), IN p_valor DECIMAL(10,2),
  IN p_minimo_compra DECIMAL(10,2), IN p_usos_max INT, IN p_fecha_inicio DATETIME,
  IN p_fecha_fin DATETIME, IN p_activo INT
)
BEGIN
  INSERT INTO cupones (id, codigo, tipo, valor, minimo_compra, usos_maximos, fecha_inicio, fecha_fin, activo)
  VALUES (p_id, p_codigo, p_tipo, p_valor, p_minimo_compra, p_usos_max, p_fecha_inicio, p_fecha_fin, p_activo);

  SELECT * FROM cupones WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_cupon$$
CREATE PROCEDURE sp_eliminar_cupon(IN p_id CHAR(36))
BEGIN
  DELETE FROM cupones WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_incrementar_uso_cupon$$
CREATE PROCEDURE sp_incrementar_uso_cupon(IN p_id_cupon CHAR(36))
BEGIN
  UPDATE cupones SET usos_actuales = usos_actuales + 1 WHERE id = p_id_cupon;
END$$

DROP PROCEDURE IF EXISTS sp_listar_cupones$$
CREATE PROCEDURE sp_listar_cupones()
BEGIN
  SELECT * FROM cupones ORDER BY fecha_creacion DESC;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_codigo$$
CREATE PROCEDURE sp_obtener_cupon_por_codigo(IN p_codigo VARCHAR(50), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE codigo = p_codigo LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_cupon_por_id$$
CREATE PROCEDURE sp_obtener_cupon_por_id(IN p_id CHAR(36), IN p_lock INT)
BEGIN
  IF p_lock = 1 THEN
    SELECT * FROM cupones WHERE id = p_id LIMIT 1 FOR UPDATE;
  ELSE
    SELECT * FROM cupones WHERE id = p_id LIMIT 1;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_tarifa_envio$$
CREATE PROCEDURE sp_actualizar_tarifa_envio(
  IN p_id CHAR(36), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  UPDATE tarifas_envio SET precio = p_precio, activo = p_activo, fecha_actualizacion = NOW() WHERE id = p_id;

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_crear_informacion_envio$$
CREATE PROCEDURE sp_crear_informacion_envio(
  IN p_id CHAR(36), IN p_id_pedido CHAR(36), IN p_id_distrito INT,
  IN p_nombre_completo VARCHAR(100),
  IN p_direccion VARCHAR(255), IN p_referencia VARCHAR(255),
  IN p_codigo_postal VARCHAR(20), IN p_telefono VARCHAR(20)
)
BEGIN

  INSERT INTO informacion_envio (
    id, id_pedido, id_distrito, nombre_completo,
    direccion, referencia, codigo_postal, telefono
  ) VALUES (
    p_id, p_id_pedido, p_id_distrito, p_nombre_completo,
    p_direccion, p_referencia, p_codigo_postal, p_telefono
  );
END$$

DROP PROCEDURE IF EXISTS sp_crear_tarifa_envio$$
CREATE PROCEDURE sp_crear_tarifa_envio(
  IN p_id CHAR(36), IN p_id_departamento CHAR(2), IN p_precio DECIMAL(10,2), IN p_activo INT
)
BEGIN
  INSERT INTO tarifas_envio (id, id_departamento, precio, activo)
  VALUES (p_id, p_id_departamento, p_precio, p_activo);

  SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
  FROM tarifas_envio t
  INNER JOIN departamentos d ON d.id = t.id_departamento
  WHERE t.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_tarifa_envio$$
CREATE PROCEDURE sp_eliminar_tarifa_envio(IN p_id CHAR(36))
BEGIN
  DELETE FROM tarifas_envio WHERE id = p_id;
  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_listar_departamentos$$
CREATE PROCEDURE sp_listar_departamentos()
BEGIN
  SELECT id, nombre, ubigeo FROM departamentos ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_distritos_por_provincia$$
CREATE PROCEDURE sp_listar_distritos_por_provincia(IN p_id_provincia INT)
BEGIN
  SELECT id, nombre, id_provincia, ubigeo FROM distritos WHERE id_provincia = p_id_provincia ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_provincias_por_departamento$$
CREATE PROCEDURE sp_listar_provincias_por_departamento(IN p_id_departamento INT)
BEGIN
  SELECT id, nombre, id_departamento, ubigeo FROM provincias WHERE id_departamento = p_id_departamento ORDER BY nombre ASC;
END$$

DROP PROCEDURE IF EXISTS sp_listar_tarifas_envio$$
CREATE PROCEDURE sp_listar_tarifas_envio(IN p_solo_activas INT)
BEGIN
  IF p_solo_activas = 1 THEN
    SELECT d.nombre AS departamento, t.precio
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    WHERE t.activo = 1
    ORDER BY d.nombre ASC;
  ELSE
    SELECT t.id, t.id_departamento, d.nombre AS departamento, t.precio, t.activo, t.fecha_creacion
    FROM tarifas_envio t
    INNER JOIN departamentos d ON d.id = t.id_departamento
    ORDER BY d.nombre ASC;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_departamento_por_nombre$$
CREATE PROCEDURE sp_obtener_departamento_por_nombre(IN p_nombre VARCHAR(255))
BEGIN
  SELECT id FROM departamentos WHERE nombre = p_nombre LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_id$$

CREATE PROCEDURE sp_obtener_distrito_por_id(IN p_id INT)
BEGIN
  SELECT di.id, di.nombre AS distrito, di.ubigeo,
         pr.id AS id_provincia, pr.nombre AS provincia,
         de.id AS id_departamento, de.nombre AS departamento
  FROM distritos di
  INNER JOIN provincias pr ON pr.id = di.id_provincia
  INNER JOIN departamentos de ON de.id = pr.id_departamento
  WHERE di.id = p_id
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_distrito_por_nombres$$
CREATE PROCEDURE sp_obtener_distrito_por_nombres(
  IN p_distrito VARCHAR(100), IN p_provincia VARCHAR(100), IN p_departamento VARCHAR(100)
)
BEGIN
  SELECT di.id
  FROM distritos di
  JOIN provincias pr ON di.id_provincia = pr.id
  JOIN departamentos de ON pr.id_departamento = de.id
  WHERE di.nombre = p_distrito AND pr.nombre = p_provincia AND de.nombre = p_departamento
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_info_envio_pedido$$
CREATE PROCEDURE sp_obtener_info_envio_pedido(IN p_id_pedido CHAR(36))
BEGIN
  SELECT ie.nombre_completo, ie.direccion,
         pr.nombre AS provincia, di.nombre AS distrito,
         ie.telefono
  FROM informacion_envio ie
  INNER JOIN distritos di ON di.id = ie.id_distrito
  INNER JOIN provincias pr ON pr.id = di.id_provincia
  WHERE ie.id_pedido = p_id_pedido
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_tarifa_envio$$
CREATE PROCEDURE sp_obtener_tarifa_envio(IN p_id CHAR(36))
BEGIN
  SELECT * FROM tarifas_envio WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_iniciar_bloqueo_pago$$
CREATE PROCEDURE sp_iniciar_bloqueo_pago(IN p_id_pedido CHAR(36), IN p_minutos INT)
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NOW()
  WHERE id = p_id_pedido
    AND fecha_pagado IS NULL
    AND estado_pedido <> 'Cancelado'
    AND (pago_iniciado_en IS NULL OR pago_iniciado_en < NOW() - INTERVAL p_minutos MINUTE);
END$$

DROP PROCEDURE IF EXISTS sp_liberar_bloqueo_pago$$
CREATE PROCEDURE sp_liberar_bloqueo_pago(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET pago_iniciado_en = NULL WHERE id = p_id_pedido;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pago_fallido$$
CREATE PROCEDURE sp_marcar_pago_fallido(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Fallido' WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pago_pagado$$
CREATE PROCEDURE sp_marcar_pago_pagado(IN p_charge_id VARCHAR(255))
BEGIN
  UPDATE pagos SET estado_pago = 'Pagado' WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_marcar_pedido_pagado$$
CREATE PROCEDURE sp_marcar_pedido_pagado(IN p_id_pedido CHAR(36))
BEGIN
  UPDATE pedidos SET fecha_pagado = NOW() WHERE id = p_id_pedido AND fecha_pagado IS NULL;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pago_por_charge$$
CREATE PROCEDURE sp_obtener_pago_por_charge(IN p_charge_id VARCHAR(255))
BEGIN
  SELECT id, id_pedido, estado_pago FROM pagos WHERE id_intento_pago = p_charge_id;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_pedido_para_pago$$
CREATE PROCEDURE sp_obtener_pedido_para_pago(IN p_id_pedido CHAR(36), IN p_id_comprador CHAR(36))
BEGIN
  SELECT id, precio_total, fecha_pagado, stock_reservado, estado_pedido
  FROM pedidos WHERE id = p_id_pedido AND id_comprador = p_id_comprador;
END$$

DROP PROCEDURE IF EXISTS sp_registrar_webhook$$
CREATE PROCEDURE sp_registrar_webhook(
  IN p_id CHAR(36), IN p_id_evento VARCHAR(255), IN p_tipo VARCHAR(100), IN p_id_cargo VARCHAR(255)
)
BEGIN
  INSERT INTO webhooks_procesados (id, id_evento, tipo_evento, id_cargo)
  VALUES (p_id, p_id_evento, p_tipo, p_id_cargo);
END$$

DROP PROCEDURE IF EXISTS sp_verificar_webhook_procesado$$
CREATE PROCEDURE sp_verificar_webhook_procesado(IN p_id_evento VARCHAR(255))
BEGIN
  SELECT id FROM webhooks_procesados WHERE id_evento = p_id_evento LIMIT 1;
END$$

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

DROP PROCEDURE IF EXISTS sp_actualizar_contrasena$$
CREATE PROCEDURE sp_actualizar_contrasena(IN p_id CHAR(36), IN p_hashed_password VARCHAR(255))
BEGIN
  UPDATE usuarios SET contraseña = p_hashed_password, reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_perfil$$
CREATE PROCEDURE sp_actualizar_perfil(IN p_id CHAR(36), IN p_nombre VARCHAR(100), IN p_email VARCHAR(100), IN p_imagen JSON)
BEGIN
  IF p_imagen IS NOT NULL THEN
    UPDATE usuarios SET nombre = p_nombre, email = p_email, imagen = p_imagen WHERE id = p_id;
  ELSE
    UPDATE usuarios SET nombre = p_nombre, email = p_email WHERE id = p_id;
  END IF;

  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_actualizar_reset_token$$
CREATE PROCEDURE sp_actualizar_reset_token(IN p_id CHAR(36), IN p_token VARCHAR(255), IN p_expire DATETIME)
BEGIN
  UPDATE usuarios SET reset_contraseña_token = p_token, reset_contraseña_expire = p_expire WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_contar_pedidos_pagados_por_usuario$$
CREATE PROCEDURE sp_contar_pedidos_pagados_por_usuario(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM pedidos WHERE id_comprador = p_id_usuario AND fecha_pagado IS NOT NULL;
END$$

DROP PROCEDURE IF EXISTS sp_contar_productos_por_creador$$
CREATE PROCEDURE sp_contar_productos_por_creador(IN p_id_usuario CHAR(36))
BEGIN
  SELECT COUNT(*) AS total FROM productos WHERE creado_por = p_id_usuario;
END$$

DROP PROCEDURE IF EXISTS sp_contar_usuarios_por_rol$$
CREATE PROCEDURE sp_contar_usuarios_por_rol(IN p_rol_nombre VARCHAR(50))
BEGIN
  SELECT COUNT(*) AS total_usuarios
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre;
END$$

DROP PROCEDURE IF EXISTS sp_eliminar_usuario$$
CREATE PROCEDURE sp_eliminar_usuario(IN p_id CHAR(36))
BEGIN
  DELETE FROM usuarios WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_limpiar_intentos_fallidos$$
CREATE PROCEDURE sp_limpiar_intentos_fallidos(IN p_id CHAR(36))
BEGIN

  UPDATE usuarios
  SET intentos_fallidos = 0, bloqueado_hasta = NULL
  WHERE id = p_id AND (intentos_fallidos <> 0 OR bloqueado_hasta IS NOT NULL);

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_limpiar_reset_token$$
CREATE PROCEDURE sp_limpiar_reset_token(IN p_id CHAR(36))
BEGIN
  UPDATE usuarios SET reset_contraseña_token = NULL, reset_contraseña_expire = NULL WHERE id = p_id;
END$$

DROP PROCEDURE IF EXISTS sp_listar_usuarios_paginado$$
CREATE PROCEDURE sp_listar_usuarios_paginado(
  IN p_rol_nombre VARCHAR(50),
  IN p_limite INT,
  IN p_offset INT
)
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE r.nombre = p_rol_nombre
  ORDER BY u.fecha_creacion DESC
  LIMIT p_limite OFFSET p_offset;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_rol_por_nombre$$
CREATE PROCEDURE sp_obtener_rol_por_nombre(IN p_nombre VARCHAR(50))
BEGIN
  SELECT id FROM roles WHERE nombre = p_nombre LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_email_nombre$$
CREATE PROCEDURE sp_obtener_usuario_email_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre, email FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_nombre$$
CREATE PROCEDURE sp_obtener_usuario_nombre(IN p_id CHAR(36))
BEGIN
  SELECT nombre FROM usuarios WHERE id = p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_email$$
CREATE PROCEDURE sp_obtener_usuario_por_email(IN p_email VARCHAR(100))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen, u.fecha_creacion,
         u.intentos_fallidos, u.bloqueado_hasta,
         u.google_id,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id IS NOT NULL) AS tiene_google,
         (u.bloqueado_hasta IS NOT NULL AND u.bloqueado_hasta > NOW()) AS esta_bloqueado,
         TIMESTAMPDIFF(SECOND, NOW(), u.bloqueado_hasta) AS segundos_restantes
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.email = p_email
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_google$$

CREATE PROCEDURE sp_obtener_usuario_por_google(
  IN p_google_id VARCHAR(64),
  IN p_email VARCHAR(100)
)
BEGIN
  SELECT u.id, u.nombre, u.email, u.imagen, u.google_id, r.nombre AS rol,
         u.fecha_creacion,
         (u.contraseña IS NOT NULL) AS tiene_contrasena,
         (u.google_id  IS NOT NULL) AS tiene_google,
         (u.google_id IS NOT NULL AND u.google_id = p_google_id) AS coincide_google
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.google_id = p_google_id OR u.email = p_email
  ORDER BY (u.google_id = p_google_id) DESC
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_id$$
CREATE PROCEDURE sp_obtener_usuario_por_id(IN p_id CHAR(36))
BEGIN
  SELECT u.id, u.nombre, u.email, u.contraseña, r.nombre AS rol, u.imagen,
         u.reset_contraseña_token, u.reset_contraseña_expire, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.id = p_id
  LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_obtener_usuario_por_reset_token$$
CREATE PROCEDURE sp_obtener_usuario_por_reset_token(IN p_token VARCHAR(255))
BEGIN
  SELECT u.id, u.nombre, u.email, r.nombre AS rol, u.imagen, u.fecha_creacion
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.id_rol
  WHERE u.reset_contraseña_token = p_token AND u.reset_contraseña_expire > NOW();
END$$

DROP PROCEDURE IF EXISTS sp_registrar_intento_fallido$$
CREATE PROCEDURE sp_registrar_intento_fallido(
  IN p_email VARCHAR(100),
  IN p_max_intentos INT,
  IN p_minutos_bloqueo INT
)
BEGIN

  UPDATE usuarios
  SET bloqueado_hasta = IF(intentos_fallidos + 1 >= p_max_intentos,
                           NOW() + INTERVAL p_minutos_bloqueo MINUTE,
                           bloqueado_hasta),
      intentos_fallidos = IF(intentos_fallidos + 1 >= p_max_intentos,
                             0,
                             intentos_fallidos + 1)
  WHERE email = p_email;

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_registrar_usuario$$
CREATE PROCEDURE sp_registrar_usuario(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_contrasena TEXT,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, id_rol)
  VALUES (p_id, p_nombre, p_email, p_contrasena, p_id_rol);
END$$

DROP PROCEDURE IF EXISTS sp_registrar_usuario_google$$

CREATE PROCEDURE sp_registrar_usuario_google(
  IN p_id CHAR(36),
  IN p_nombre VARCHAR(100),
  IN p_email VARCHAR(100),
  IN p_google_id VARCHAR(64),
  IN p_imagen JSON,
  IN p_id_rol INT
)
BEGIN
  INSERT INTO usuarios (id, nombre, email, contraseña, google_id, imagen, id_rol)
  VALUES (p_id, p_nombre, p_email, NULL, p_google_id, p_imagen, p_id_rol);

  SELECT ROW_COUNT() AS affected;
END$$

DROP PROCEDURE IF EXISTS sp_verificar_email_en_uso$$
CREATE PROCEDURE sp_verificar_email_en_uso(IN p_email VARCHAR(100), IN p_id CHAR(36))
BEGIN
  SELECT id FROM usuarios WHERE email = p_email AND id <> p_id LIMIT 1;
END$$

DROP PROCEDURE IF EXISTS sp_vincular_google$$

CREATE PROCEDURE sp_vincular_google(
  IN p_id CHAR(36),
  IN p_google_id VARCHAR(64)
)
BEGIN
  UPDATE usuarios
  SET google_id = p_google_id
  WHERE id = p_id AND google_id IS NULL;

  IF ROW_COUNT() = 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'GOOGLE_YA_VINCULADO';
  END IF;

  SELECT ROW_COUNT() AS affected;
END$$

DELIMITER ;
