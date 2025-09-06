import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();
import { UPLOADS_DIR } from './utils/paths.js';

import { userRouter } from './Routes/usuariosR.js';
import { perfilesRouter } from './Routes/perfilesR.js';
import { empresasRouter } from './Routes/empresasR.js';
import { eventosRouter } from './Routes/eventosR.js';
import { valoracionesRouter } from './Routes/valoracionesR.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 👉 servir SIEMPRE la misma carpeta
app.use('/uploads', express.static(UPLOADS_DIR));
console.log('📂 Sirviendo /uploads desde:', UPLOADS_DIR);

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ /uploads sale de .env (o fallback local)
const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, 'uploads');

app.use('/uploads', express.static(uploadsDir));
console.log('📂 Sirviendo /uploads desde:', uploadsDir);

// rutas
app.use('/auth', userRouter);
app.use('/api', perfilesRouter);
app.use('/api', empresasRouter);
app.use('/api', eventosRouter);
app.use('/api', valoracionesRouter);

app.listen(3000, () => {
  console.log('🚀 Servidor en funcionamiento en http://localhost:3000');
});
