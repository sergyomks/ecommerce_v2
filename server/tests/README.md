# Pruebas

Se ejecutan con el runner nativo de Node (`node --test`). No hay dependencias extra.

## Sin base de datos

```bash
npm run test:unidad
```

Cubre IGV, escapado HTML, validación de URLs, cupones y comparación de importes.

## Con base de datos

Las pruebas de conciliación de pagos y de migración necesitan MySQL. Levanta una
base desechable:

```bash
docker run -d --name mysql-ecom-test \
  -e MYSQL_ROOT_PASSWORD=testpass \
  -e MYSQL_DATABASE=ecommerce_test \
  -p 3306:3306 mysql:8.0
```

Espera unos segundos a que arranque y lanza:

```bash
npm test
```

Al terminar:

```bash
docker rm -f mysql-ecom-test
```

## Seguridad

`tests/entornoPrueba.js` aborta si el nombre de la base de datos no contiene
`test`, para que nunca puedan ejecutarse contra la base real. Las credenciales se
pueden cambiar con `TEST_DB_HOST`, `TEST_DB_USER`, `TEST_DB_PASSWORD` y
`TEST_DB_NAME`.
