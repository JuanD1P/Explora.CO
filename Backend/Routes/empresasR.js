import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.resolve(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

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
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ok.includes(file.mimetype)) return cb(new Error('Formato no permitido'));
    cb(null, true);
  },
});




router.post('/empresa/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const empresa_id = Number(req.body.empresa_id || req.user?.id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo avatar' });

    const [u] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [empresa_id]);
    if (!u.length || u[0].rol !== 'EMPRESA') {
      return res.status(403).json({ error: 'El usuario no es EMPRESA' });
    }

    const url = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [url, empresa_id]);

    res.json({ message: 'Avatar actualizado', avatar_url: url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar avatar' });
  }
});

export const empresasRouter = router;
