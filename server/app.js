import express from 'express';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import { limitadorGeneral } from './middlewares/rateLimiters.js';
import { limpiarTemporales } from './middlewares/limpiarTemporales.js';
import authRoutes from './routes/authRoutes.js';
import productoRoutes from './routes/productoRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import pagoRoutes from "./routes/pagoRoutes.js";
import pedidoRoutes from "./routes/pedidoRoutes.js";
import contactoRoutes from "./routes/contactoRoutes.js";
import categoriaRoutes from "./routes/categoriaRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cuponRoutes from "./routes/cuponRoutes.js";
import envioRoutes from "./routes/envioRoutes.js";
import subcategoriaRoutes from "./routes/subcategoriaRoutes.js";
import ubigeoRoutes from "./routes/ubigeoRoutes.js";
import { procesarWebhookCulqi } from "./controllers/pagoController.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'config', 'config.env') });

const origenesConfigurados = [process.env.FRONTEND_URL, process.env.DASHBOARD_URL].filter(Boolean);

const esOrigenPermitido = (origin, callback) => {
    if (!origin) return callback(null, true);

    if (origenesConfigurados.includes(origin)) {
        return callback(null, true);
    }

    if (/^http:\/\/(localhost|127\.0\.0\.1):(517[0-9]|3000)$/.test(origin)) {
        return callback(null, true);
    }

    callback(new Error(`CORS no permitido para el origen: ${origin}`));
};

const detrasDeProxy =
    process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production';

if (detrasDeProxy) {
    app.set('trust proxy', 1);
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(
    cors({
        origin: esOrigenPermitido,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    })
);

app.post("/api/v1/payment/webhook", express.json({ limit: '100kb' }), procesarWebhookCulqi);

app.use(limitadorGeneral);
app.use(cookieParser());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

app.use(fileUpload({
    tempFileDir: path.join(__dirname, 'uploads'),
    useTempFiles: true,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
    abortOnLimit: true,
    responseOnLimit: JSON.stringify({
        success: false,
        message: "El archivo supera el máximo de 5 MB.",
    }),
}));
app.use(limpiarTemporales);
app.use('/api/auth', authRoutes);
app.use('/api/producto', productoRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pago', pagoRoutes);
app.use('/api/pedido', pedidoRoutes);
app.use('/api', contactoRoutes);
app.use('/api/categoria', categoriaRoutes);
app.use('/api/subcategoria', subcategoriaRoutes);
app.use('/api/ubigeo', ubigeoRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cupon', cuponRoutes);
app.use('/api/envio', envioRoutes);

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
});

app.use(errorMiddleware);
export default app;
