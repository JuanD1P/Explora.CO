import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { userRouter } from './Routes/usuariosR.js';
import { imagenesRouter } from './Routes/imagenesR.js';

const app = express();

app.use(cors({
  origin: ['http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/auth', userRouter);
app.use('/api', imagenesRouter);  

app.listen(3000, () => {
  console.log('🚀 Servidor en funcionamiento en http://localhost:3000');
});
