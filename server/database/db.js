import mysql from 'mysql2/promise';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', 'config', 'config.env') });

if (!process.env.DB_PASSWORD && process.env.NODE_ENV === 'production') {
    console.warn('DB_PASSWORD no está definido en el entorno.');
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexión a la base de datos MySQL establecida correctamente.');
        connection.release();
    } catch (error) {
        console.error('Error al conectar a la base de datos MySQL:', error.message);
    }
};

testConnection();

export default pool;
