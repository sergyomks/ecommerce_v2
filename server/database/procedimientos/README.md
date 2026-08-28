# Procedimientos almacenados

Los 110 procedimientos de tairo_v1, uno por archivo `.sql`, agrupados por dominio.

Estos archivos son **la fuente de la verdad**. La copia que ejecuta MySQL es el
resultado de instalarlos; si editas un procedimiento en Workbench sin tocar el
`.sql`, ese cambio se pierde en cuanto alguien reinstale.

```
procedimientos/
├── usuarios/     17  auth, perfil, roles, reset de contraseña
├── catalogo/     33  productos, categorías, subcategorías, reseñas
├── pedidos/      20  alta, consulta, estado, stock
├── pagos/         9  cargos, webhooks, bloqueo de pago
├── cupones/       8
├── envios/       13  ubigeo, tarifas, información de envío
├── contenido/    10  contacto, wishlist, panel
├── instalar.sql      los 110 juntos, para instalar de una vez
├── aplicar.js        instalador desde Node (alternativa a hacerlo a mano)
└── README.md
```

Cada dominio tiene además un `_instalar.sql` con solo los suyos.

## Instalar

**Desde la línea de comandos** — lo normal tras clonar el proyecto:

```bash
mysql --default-character-set=utf8mb4 -u root -p ecommerce_db \
  < database/procedimientos/instalar.sql
```

**Desde MySQL Workbench** — abre `instalar.sql` y ejecútalo entero
(⚡ o Ctrl+Shift+Enter).

**Uno solo**, cuando estás trabajando en él:

```bash
mysql --default-character-set=utf8mb4 -u root -p ecommerce_db \
  < database/procedimientos/pagos/sp_marcar_pedido_pagado.sql
```

**Desde Node**, si prefieres no salir de la terminal del proyecto:

```bash
npm run db:sp            # los 110
npm run db:sp -- pagos   # solo un dominio
npm run db:sp -- sp_crear_pedido
```

## Comprobar qué hay instalado

```bash
npm run db:sp:check
```

Compara los `.sql` del proyecto con `information_schema.ROUTINES` y lista lo que
falta y lo que sobra. El servidor hace esta misma comprobación al arrancar y se
niega a levantar si falta algo, diciéndote cuál.

## Escribir uno nuevo

1. Crea el `.sql` en la carpeta del dominio que le toca.
2. Nómbralo `sp_<verbo>_<entidad>` — verbos: `obtener` (una fila), `listar`
   (varias), `contar`, `crear`, `actualizar`, `eliminar`, `marcar`, `verificar`,
   `bloquear`. Parámetros siempre con prefijo `p_`.
3. Copia la estructura de cualquier archivo existente: cabecera de comentario,
   `SET NAMES utf8mb4`, `DROP PROCEDURE IF EXISTS`, y el `CREATE` entre
   `DELIMITER $$` y `DELIMITER ;`.
4. El tipo de cada parámetro debe ser el mismo que el de la columna que recibe.
5. Instálalo y añade su llamada en el controlador.

## Sobre `DELIMITER` y el juego de caracteres

Dos detalles del formato que no son decorativos:

**`DELIMITER`** no es SQL: es una instrucción del cliente `mysql` para saber
dónde parte las sentencias, necesaria porque un `CREATE PROCEDURE` lleva `;`
dentro del `BEGIN…END`. Por eso está en los archivos —los hace ejecutables tal
cual en Workbench y en la línea de comandos. El driver de Node (mysql2) no la
entiende, así que `aplicar.js` la quita antes de enviar el SQL.

**`SET NAMES utf8mb4`** tampoco sobra. El esquema tiene identificadores con
acentos (`usuarios.contraseña`, `usuarios.reset_contraseña_token`) y el cliente
`mysql` asume latin1 por defecto: sin esa línea manda la `ñ` mal codificada y el
`CREATE` falla con un error de sintaxis que apunta a la línea equivocada. Es
también la razón del `--default-character-set=utf8mb4` en los comandos de arriba.

## Pendiente

Estos archivos son una extracción fiel del antiguo `models/tablaProcedimientos.js`:
el SQL es idéntico, solo cambió dónde vive. Las mejoras señaladas en la auditoría
—`SQL SECURITY INVOKER` en los 110, `SELECT ROW_COUNT() AS affected` en toda
escritura, y `JSON_TABLE` en lugar de `FIND_IN_SET` en
`pedidos/sp_bloquear_productos_pedido.sql`— todavía no están aplicadas.
