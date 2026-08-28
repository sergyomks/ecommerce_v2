# Migraciones

Carpeta reservada para el DDL versionado (`CREATE TABLE`, `ALTER TABLE`, índices).

**Todavía no está en uso.** Hoy el esquema se crea y se migra al arrancar el
servidor, desde `models/` y orquestado por `utils/crearTabla.js`:

- `models/tabla*.js` — un archivo por tabla, con su `CREATE TABLE IF NOT EXISTS`
  y sus migraciones idempotentes (comprueban `SHOW COLUMNS` antes de actuar).
- `models/indices.js` — índices de rendimiento.

Mover eso aquí es el siguiente paso natural tras la reestructuración de los
procedimientos: archivos `.sql` numerados (`001_crear_usuarios.sql`,
`002_productos_categoria_a_fk.sql`, …), una tabla `esquema_version` que registre
qué se aplicó y cuándo, y un `npm run db:migrate` explícito en lugar de DDL como
efecto secundario de `npm start`.

Mientras tanto, esta carpeta queda vacía a propósito.
