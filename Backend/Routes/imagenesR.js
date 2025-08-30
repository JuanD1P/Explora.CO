import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const router = Router();

// __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar carpeta /uploads
const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

// Multer: almacenamiento en disco
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ok.includes(file.mimetype)) return cb(new Error('Formato no permitido'));
    cb(null, true);
  },
});

// Pool MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',           // <-- ajusta
  password: '',           // <-- ajusta
  database: 'exploraco',  // tu base
  waitForConnections: true,
  connectionLimit: 10,
});

// POST /api/imagenes  (form-data: imagen, titulo?, alt_text?)
router.post('/imagenes', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Falta la imagen' });
    const { titulo, alt_text } = req.body;
    const imagen_url = `/uploads/${req.file.filename}`; // ruta pública

    await pool.query(
      'INSERT INTO imagenes (titulo, alt_text, imagen_url) VALUES (?, ?, ?)',
      [titulo || null, alt_text || null, imagen_url]
    );

    res.status(201).json({ message: 'Imagen subida', imagen_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la imagen' });
  }
});

// GET /api/imagenes  (listar)
router.get('/imagenes', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM imagenes ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar imágenes' });
  }
});

export const imagenesRouter = router;
