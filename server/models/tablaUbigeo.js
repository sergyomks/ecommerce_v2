import pool from "../database/db.js";

const DEPARTAMENTOS_SEED = [
  "Lima", "Callao", "Arequipa", "Cusco", "La Libertad", "Piura", "Lambayeque",
  "Junín", "Puno", "Ancash", "Ica", "Cajamarca", "San Martín", "Loreto",
  "Ucayali", "Madre de Dios", "Tacna", "Moquegua", "Ayacucho", "Huánuco",
  "Pasco", "Huancavelica", "Apurímac", "Amazonas", "Tumbes"
];

const UBIGEO_SEED = [
  { departamento: "Lima", provincia: "Lima", distritos: ["Miraflores", "San Isidro", "Santiago de Surco", "Lima", "San Borja", "La Molina", "Barranco", "Jesús María", "Lince", "Magdalena del Mar", "San Miguel", "Pueblo Libre"] },
  { departamento: "Callao", provincia: "Callao", distritos: ["Callao", "Bellavista", "La Punta", "Carmen de la Legua", "La Perla", "Ventanilla"] },
  { departamento: "Arequipa", provincia: "Arequipa", distritos: ["Arequipa", "Yanahuara", "Cayma", "Cerro Colorado", "Jose Luis Bustamante y Rivero"] },
  { departamento: "Cusco", provincia: "Cusco", distritos: ["Cusco", "Wanchaq", "San Sebastián", "San Jerónimo"] },
  { departamento: "La Libertad", provincia: "Trujillo", distritos: ["Trujillo", "Víctor Larco Herrera", "Florencia de Mora", "Huanchaco"] },
  { departamento: "Piura", provincia: "Piura", distritos: ["Piura", "Castilla", "Veintiséis de Octubre", "Catacaos"] },
  { departamento: "Lambayeque", provincia: "Chiclayo", distritos: ["Chiclayo", "La Victoria", "Pimentel", "José Leonardo Ortiz"] }
];

export async function crearUbigeoTablas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        ubigeo CHAR(6) DEFAULT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS provincias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        id_departamento INT NOT NULL,
        ubigeo CHAR(6) DEFAULT NULL,
        FOREIGN KEY (id_departamento) REFERENCES departamentos(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS distritos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        id_provincia INT NOT NULL,
        ubigeo CHAR(6) DEFAULT NULL,
        FOREIGN KEY (id_provincia) REFERENCES provincias(id) ON DELETE CASCADE
      );
    `);

    const [depRows] = await pool.query(`SELECT COUNT(*) AS total FROM departamentos`);
    if (Number(depRows[0].total) === 0) {
      for (const depNombre of DEPARTAMENTOS_SEED) {
        await pool.query(`INSERT INTO departamentos (nombre) VALUES (?)`, [depNombre]);
      }

      for (const item of UBIGEO_SEED) {
        const [d] = await pool.query(`SELECT id FROM departamentos WHERE nombre = ? LIMIT 1`, [item.departamento]);
        if (d.length > 0) {
          const depId = d[0].id;
          const [resProv] = await pool.query(
            `INSERT INTO provincias (nombre, id_departamento) VALUES (?, ?)`,
            [item.provincia, depId]
          );
          const provId = resProv.insertId;

          for (const distNombre of item.distritos) {
            await pool.query(
              `INSERT INTO distritos (nombre, id_provincia) VALUES (?, ?)`,
              [distNombre, provId]
            );
          }
        }
      }

      for (const depNombre of DEPARTAMENTOS_SEED) {
        const [d] = await pool.query(`SELECT id FROM departamentos WHERE nombre = ? LIMIT 1`, [depNombre]);
        if (d.length > 0) {
          const depId = d[0].id;
          const [p] = await pool.query(`SELECT id FROM provincias WHERE id_departamento = ? LIMIT 1`, [depId]);
          if (p.length === 0) {
            const [resProv] = await pool.query(
              `INSERT INTO provincias (nombre, id_departamento) VALUES (?, ?)`,
              [depNombre, depId]
            );
            await pool.query(
              `INSERT INTO distritos (nombre, id_provincia) VALUES (?, ?)`,
              [depNombre, resProv.insertId]
            );
          }
        }
      }

      console.log("Tablas geográficas (Ubigeo Perú) inicializadas.");
    }
  } catch (error) {
    console.error("Error al crear tablas geográficas (Ubigeo):", error.message);
    throw error;
  }
}
