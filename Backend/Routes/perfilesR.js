import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.resolve(__dirname, '../uploads');

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
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ok.includes(file.mimetype)) return cb(new Error('Formato no permitido'));
    cb(null, true);
  },
});

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'exploraco',
  waitForConnections: true,
  connectionLimit: 10,
});

const CATS = new Set([
  'Atractivos Naturales',
  'Atractivos Culturales',
  'Atractivos Recreativos',
  'Atractivos Gastronómicos',
  'Atractivos Arqueológicos',
  'Atractivos Históricos',
]);


router.post('/empresa/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const empresa_id = Number(req.body.empresa_id || req.user?.id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });
    if (!req.file)   return res.status(400).json({ error: 'Falta el archivo avatar' });

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

router.post('/perfiles', upload.array('fotos', 10), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const empresa_id = Number(req.body.empresa_id || req.user?.id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

    const [urows] = await conn.query('SELECT rol FROM usuarios WHERE id = ?', [empresa_id]);
    if (!urows.length || urows[0].rol !== 'EMPRESA') {
      return res.status(403).json({ error: 'El usuario no es EMPRESA' });
    }

    const {
      nombre_lugar,
      categoria,
      descripcion,
      ciudad,
      direccion,
      lat,
      lng,
      horario_desde,
      horario_hasta,
      moneda,
      precio_desde,
      precio_hasta,
      info_precios
    } = req.body;

    if (!nombre_lugar || !categoria || !ciudad || !direccion || !lat || !lng) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }
    if (!CATS.has(categoria)) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }

    if ((horario_desde && !horario_hasta) || (!horario_desde && horario_hasta)) {
      return res.status(400).json({ error: 'Debes enviar horario_desde y horario_hasta juntos o ninguno' });
    }
    if (horario_desde && horario_hasta && horario_desde >= horario_hasta) {
      return res.status(400).json({ error: 'El horario_desde debe ser menor que horario_hasta' });
    }

    const pDesde = precio_desde ? Number(precio_desde) : null;
    const pHasta = precio_hasta ? Number(precio_hasta) : null;
    if ((pDesde !== null && pDesde < 0) || (pHasta !== null && pHasta < 0)) {
      return res.status(400).json({ error: 'Los precios no pueden ser negativos' });
    }
    if (pDesde !== null && pHasta !== null && pDesde > pHasta) {
      return res.status(400).json({ error: 'precio_desde no puede ser mayor a precio_hasta' });
    }

    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO perfilempresa
        (empresa_id, nombre_lugar, categoria, descripcion, ciudad, direccion, lat, lng,
         horario_desde, horario_hasta, moneda, precio_desde, precio_hasta, info_precios)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        empresa_id,
        nombre_lugar,
        categoria,
        descripcion || null,
        ciudad,
        direccion,
        Number(lat),
        Number(lng),
        horario_desde || null,
        horario_hasta || null,
        (moneda || 'COP'),
        pDesde,
        pHasta,
        info_precios || null,
      ]
    );
    const perfilId = result.insertId;


    const files = req.files || [];
    for (const f of files) {
      const url = `/uploads/${f.filename}`;
      await conn.query(
        'INSERT INTO perfilempresa_fotos (perfil_id, imagen_url) VALUES (?, ?)',
        [perfilId, url]
      );
    }

    await conn.commit();

    const [perfilRows] = await conn.query('SELECT * FROM perfilempresa WHERE id = ?', [perfilId]);
    const [fotosRows]  = await conn.query('SELECT * FROM perfilempresa_fotos WHERE perfil_id = ?', [perfilId]);

    res.status(201).json({ perfil: perfilRows[0], fotos: fotosRows });
  } catch (err) {
    console.error(err);
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'Error creando perfil' });
  } finally {
    conn.release();
  }
});


router.get('/perfiles', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : null;

    const sql = `
      SELECT p.*, u.avatar_url
      FROM perfilempresa p
      LEFT JOIN usuarios u ON u.id = p.empresa_id
      ${empresaId ? 'WHERE p.empresa_id = ?' : ''}
      ORDER BY p.created_at DESC
    `;
    const params = empresaId ? [empresaId] : [];
    const [perfiles] = await pool.query(sql, params);

    const ids = perfiles.map(p => p.id);
    let fotos = [];
    if (ids.length) {
      const [rows] = await pool.query(
        `SELECT * FROM perfilempresa_fotos WHERE perfil_id IN (${ids.map(() => '?').join(',')})`,
        ids
      );
      fotos = rows;
    }

    const byPerfil = new Map();
    for (const p of perfiles) byPerfil.set(p.id, { ...p, fotos: [] });
    for (const f of fotos) byPerfil.get(f.perfil_id)?.fotos.push(f);

    res.json(Array.from(byPerfil.values()));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando perfiles' });
  }
});

router.get('/perfiles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const sql = `
      SELECT p.*, u.avatar_url
      FROM perfilempresa p
      LEFT JOIN usuarios u ON u.id = p.empresa_id
      WHERE p.id = ?
    `;
    const [[perfil]] = await pool.query(sql, [id]);
    if (!perfil) return res.status(404).json({ error: 'Perfil no encontrado' });

    const [fotos] = await pool.query('SELECT * FROM perfilempresa_fotos WHERE perfil_id = ?', [id]);
    res.json({ ...perfil, fotos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

router.put('/perfiles/:id', upload.array('fotos', 10), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const [exists] = await conn.query('SELECT * FROM perfilempresa WHERE id = ?', [id]);
    if (!exists.length) return res.status(404).json({ error: 'Perfil no encontrado' });

    const {
      nombre_lugar,
      categoria,
      descripcion,
      ciudad,
      direccion,
      lat,
      lng,
      horario_desde,
      horario_hasta,
      moneda,
      precio_desde,
      precio_hasta,
      info_precios,
      remove_foto_ids,
    } = req.body;

    if (categoria && !CATS.has(categoria)) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }
    if ((horario_desde && !horario_hasta) || (!horario_desde && horario_hasta)) {
      return res.status(400).json({ error: 'Debes enviar horario_desde y horario_hasta juntos o ninguno' });
    }
    if (horario_desde && horario_hasta && horario_desde >= horario_hasta) {
      return res.status(400).json({ error: 'El horario_desde debe ser menor que horario_hasta' });
    }

    const pDesde = (precio_desde !== undefined && precio_desde !== '' ? Number(precio_desde) : null);
    const pHasta = (precio_hasta !== undefined && precio_hasta !== '' ? Number(precio_hasta) : null);
    if ((pDesde !== null && pDesde < 0) || (pHasta !== null && pHasta < 0)) {
      return res.status(400).json({ error: 'Los precios no pueden ser negativos' });
    }
    if (pDesde !== null && pHasta !== null && pDesde > pHasta) {
      return res.status(400).json({ error: 'precio_desde no puede ser mayor a precio_hasta' });
    }

    const fields = [];
    const values = [];
    const setIf = (col, val, transform = (x)=>x) => {
      if (val !== undefined) { fields.push(`${col} = ?`); values.push(transform(val)); }
    };

    setIf('nombre_lugar', nombre_lugar);
    setIf('categoria', categoria);
    setIf('descripcion', descripcion);
    setIf('ciudad', ciudad);
    setIf('direccion', direccion);
    setIf('lat', lat, Number);
    setIf('lng', lng, Number);
    setIf('horario_desde', horario_desde);
    setIf('horario_hasta', horario_hasta);
    setIf('moneda', moneda);
    setIf('precio_desde', precio_desde, v => (v === '' ? null : Number(v)));
    setIf('precio_hasta', precio_hasta, v => (v === '' ? null : Number(v)));
    setIf('info_precios', info_precios);

    await conn.beginTransaction();

    if (fields.length) {
      await conn.query(`UPDATE perfilempresa SET ${fields.join(', ')} WHERE id = ?`, [...values, id]);
    }

    if (remove_foto_ids) {
      let ids = [];
      try { ids = JSON.parse(remove_foto_ids); } catch {}
      if (Array.isArray(ids) && ids.length) {
        const [rows] = await conn.query(
          `SELECT * FROM perfilempresa_fotos WHERE id IN (${ids.map(()=>'?').join(',')}) AND perfil_id = ?`,
          [...ids, id]
        );
        for (const f of rows) {
          const filename = f.imagen_url.replace('/uploads/', '');
          const filepath = path.join(uploadsDir, filename);
          if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
        }
        await conn.query(
          `DELETE FROM perfilempresa_fotos WHERE id IN (${ids.map(()=>'?').join(',')}) AND perfil_id = ?`,
          [...ids, id]
        );
      }
    }

    const files = req.files || [];
    for (const f of files) {
      const url = `/uploads/${f.filename}`;
      await conn.query(
        'INSERT INTO perfilempresa_fotos (perfil_id, imagen_url) VALUES (?, ?)',
        [id, url]
      );
    }

    await conn.commit();

    const [[perfil]] = await conn.query(
      'SELECT p.*, u.avatar_url FROM perfilempresa p LEFT JOIN usuarios u ON u.id = p.empresa_id WHERE p.id = ?',
      [id]
    );
    const [fotos] = await conn.query('SELECT * FROM perfilempresa_fotos WHERE perfil_id = ?', [id]);
    res.json({ ...perfil, fotos });
  } catch (err) {
    console.error(err);
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'Error actualizando perfil' });
  } finally {
    conn.release();
  }
});

router.delete('/perfiles/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const [[perfil]] = await conn.query('SELECT * FROM perfilempresa WHERE id = ?', [id]);
    if (!perfil) return res.status(404).json({ error: 'No existe' });

    const [fotos] = await conn.query('SELECT * FROM perfilempresa_fotos WHERE perfil_id = ?', [id]);

    await conn.beginTransaction();
    await conn.query('DELETE FROM perfilempresa_fotos WHERE perfil_id = ?', [id]);
    const [result] = await conn.query('DELETE FROM perfilempresa WHERE id = ?', [id]);
    await conn.commit();

    for (const f of fotos) {
      try {
        const fname = path.basename(f.imagen_url);
        fs.unlink(path.join(uploadsDir, fname), () => {});
      } catch {}
    }

    if (!result.affectedRows) return res.status(404).json({ error: 'Perfil no encontrado' });
    res.json({ message: 'Perfil eliminado' });
  } catch (err) {
    console.error(err);
    try { await conn.rollback(); } catch {}
    res.status(500).json({ error: 'Error eliminando perfil' });
  } finally {
    conn.release();
  }
});

export const perfilesRouter = router;
