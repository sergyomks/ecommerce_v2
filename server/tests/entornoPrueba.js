import path from "path";
import { fileURLToPath } from "url";

const NOMBRE_BD = process.env.TEST_DB_NAME || "ecommerce_test";

if (!/test/i.test(NOMBRE_BD)) {
  throw new Error(
    `Las pruebas solo pueden ejecutarse contra una base de datos cuyo nombre ` +
      `contenga "test". Recibido: "${NOMBRE_BD}".`
  );
}

process.env.DB_HOST = process.env.TEST_DB_HOST || "127.0.0.1";
process.env.DB_USER = process.env.TEST_DB_USER || "root";
process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || "testpass";
process.env.DB_NAME = NOMBRE_BD;

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const cargar = (rutaRelativa) =>
  import(path.join(RAIZ, rutaRelativa));

export const AYUDA_DOCKER = `
No se pudo conectar a MySQL en ${process.env.DB_HOST}/${NOMBRE_BD}.

Levanta una base de pruebas con:

  docker run -d --name mysql-ecom-test \\
    -e MYSQL_ROOT_PASSWORD=testpass \\
    -e MYSQL_DATABASE=${NOMBRE_BD} \\
    -p 3306:3306 mysql:8.0

Variables admitidas: TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_NAME.
`;

export const prepararEsquema = async () => {
  const { aplicarProcedimientos } = await cargar(
    "database/procedimientos/aplicar.js"
  );
  await aplicarProcedimientos();

  const { crearTablas } = await cargar("utils/crearTabla.js");
  await crearTablas();
};

export const comprobarConexion = async (pool) => {
  try {
    const conexion = await pool.getConnection();
    conexion.release();
  } catch {
    console.error(AYUDA_DOCKER);
    throw new Error("Base de datos de pruebas no disponible.");
  }
};
