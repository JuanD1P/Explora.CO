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

// ========== Helper para URLs absolutas ==========
function absoluteUrl(req, image_url) {
  if (!image_url) return image_url;
  const base = `${req.protocol}://${req.get('host')}`;
  return image_url.startsWith('http')
    ? image_url
    : image_url.startsWith('/')
      ? base + image_url
      : `${base}/${image_url}`;
}

async function getEventoConFotos(connOrPool, id, req) {
  const [eventoRows] = await connOrPool.query('SELECT * FROM eventos_lugar WHERE id=?', [id]);
  if (!eventoRows.length) return null;
  const evento = eventoRows[0];
  const [fotosRows] = await connOrPool.query('SELECT * FROM eventos_lugar_fotos WHERE evento_id=?', [id]);
  const fotosAbs = fotosRows.map(f => ({ ...f, imagen_url: absoluteUrl(req, f.imagen_url) }));
  return { ...evento, fotos: fotosAbs };
}

function filePathFromUrl(image_url) {
  const filename = path.basename(image_url);
  return path.join(uploadsDir, filename);
}

// =================== POST /eventos ===================
router.post('/eventos', upload.array('fotos', 10), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const empresa_id = Number(req.body.empresa_id || req.user?.id);
    const perfil_id = Number(req.body.perfil_id);

    if (!empresa_id || !perfil_id) return res.status(400).json({ error: 'empresa_id y perfil_id son requeridos' });

    const { nombre_evento, descripcion } = req.body;
    if (!nombre_evento) return res.status(400).json({ error: 'nombre_evento es requerido' });

    const [pRows] = await conn.query('SELECT id FROM perfilempresa WHERE id=? AND empresa_id=?', [perfil_id, empresa_id]);
    if (!pRows.length) return res.status(403).json({ error: 'El lugar no pertenece a la empresa' });

    await conn.beginTransaction();

    const [ins] = await conn.query(
      'INSERT INTO eventos_lugar (perfil_id, empresa_id, nombre_evento, descripcion) VALUES (?, ?, ?, ?)',
      [perfil_id, empresa_id, nombre_evento, descripcion || null]
    );
    const eventoId = ins.insertId;

    const files = req.files || [];
    for (const f of files) {
      const url = `/uploads/${f.filename}`;
      await conn.query('INSERT INTO eventos_lugar_fotos (evento_id, imagen_url) VALUES (?, ?)', [eventoId, url]);
    }

    await conn.commit();

    const [evento] = await conn.query('SELECT * FROM eventos_lugar WHERE id=?', [eventoId]);
    const [fotos] = await conn.query('SELECT * FROM eventos_lugar_fotos WHERE evento_id=?', [eventoId]);
    const fotosAbs = fotos.map(f => ({ ...f, imagen_url: absoluteUrl(req, f.imagen_url) }));

    res.status(201).json({ evento: evento[0], fotos: fotosAbs });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ error: 'Error creando evento' });
  } finally {
    conn.release();
  }
});

// =================== GET /eventos ===================
router.get('/eventos', async (req, res) => {
  try {
    const empresaId = req.query.empresa_id ? Number(req.query.empresa_id) : null;
    const perfilId = req.query.perfil_id ? Number(req.query.perfil_id) : null;

    let where = [];
    let args = [];
    if (empresaId) { where.push('empresa_id = ?'); args.push(empresaId); }
    if (perfilId) { where.push('perfil_id = ?'); args.push(perfilId); }

    const sql = `SELECT * FROM eventos_lugar ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY created_at DESC`;
    const [eventos] = await pool.query(sql, args);

    const ids = eventos.map(e => e.id);
    let fotos = [];
    if (ids.length) {
      const [rows] = await pool.query(
        `SELECT * FROM eventos_lugar_fotos WHERE evento_id IN (${ids.map(() => '?').join(',')})`, ids
      );
      fotos = rows;
    }

    const map = new Map();
    for (const e of eventos) map.set(e.id, { ...e, fotos: [] });
    for (const f of fotos) {
      f.imagen_url = absoluteUrl(req, f.imagen_url);
      map.get(f.evento_id)?.fotos.push(f);
    }

    res.json(Array.from(map.values()));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error listando eventos' });
  }
});

// =================== GET /eventos/:id ===================
router.get('/eventos/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const data = await getEventoConFotos(pool, id, req);
    if (!data) return res.status(404).json({ error: 'Evento no encontrado' });

    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error obteniendo evento' });
  }
});

// =================== PUT /eventos/:id ===================
router.put('/eventos/:id', upload.array('fotos', 10), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const empresa_id = Number(req.body.empresa_id || req.user?.id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

    const [rows] = await conn.query(
      'SELECT e.*, p.empresa_id AS owner_empresa FROM eventos_lugar e JOIN perfilempresa p ON p.id=e.perfil_id WHERE e.id=?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
    if (rows[0].owner_empresa !== empresa_id) return res.status(403).json({ error: 'No puedes modificar este evento' });

    const { nombre_evento, descripcion } = req.body;

    await conn.beginTransaction();

    if (typeof nombre_evento !== 'undefined' || typeof descripcion !== 'undefined') {
      await conn.query(
        'UPDATE eventos_lugar SET nombre_evento = COALESCE(?, nombre_evento), descripcion = COALESCE(?, descripcion) WHERE id=?',
        [nombre_evento ?? null, typeof descripcion === 'undefined' ? null : descripcion, id]
      );
    }

    let removeIds = req.body.remove_foto_ids;
    if (typeof removeIds === 'string') {
      try { removeIds = JSON.parse(removeIds); } catch { removeIds = []; }
    }
    if (Array.isArray(removeIds) && removeIds.length) {
      const [toDel] = await conn.query(
        `SELECT * FROM eventos_lugar_fotos WHERE evento_id=? AND id IN (${removeIds.map(() => '?').join(',')})`,
        [id, ...removeIds.map(Number)]
      );
      for (const f of toDel) {
        try { fs.unlinkSync(filePathFromUrl(f.imagen_url)); } catch {}
      }
      await conn.query(
        `DELETE FROM eventos_lugar_fotos WHERE evento_id=? AND id IN (${removeIds.map(() => '?').join(',')})`,
        [id, ...removeIds.map(Number)]
      );
    }

    const files = req.files || [];
    for (const f of files) {
      const url = `/uploads/${f.filename}`;
      await conn.query('INSERT INTO eventos_lugar_fotos (evento_id, imagen_url) VALUES (?, ?)', [id, url]);
    }

    await conn.commit();

    const data = await getEventoConFotos(conn, id, req);
    res.json({ ok: true, evento: data });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ error: 'Error actualizando evento' });
  } finally {
    conn.release();
  }
});

// =================== DELETE /eventos/:id ===================
router.delete('/eventos/:id', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });

    const empresa_id = Number(req.query.empresa_id || req.body?.empresa_id || req.user?.id);
    if (!empresa_id) return res.status(400).json({ error: 'empresa_id requerido' });

    const [rows] = await conn.query(
      'SELECT e.*, p.empresa_id AS owner_empresa FROM eventos_lugar e JOIN perfilempresa p ON p.id=e.perfil_id WHERE e.id=?',
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Evento no encontrado' });
    if (rows[0].owner_empresa !== empresa_id) return res.status(403).json({ error: 'No puedes eliminar este evento' });

    await conn.beginTransaction();

    const [fotos] = await conn.query('SELECT * FROM eventos_lugar_fotos WHERE evento_id=?', [id]);
    await conn.query('DELETE FROM eventos_lugar_fotos WHERE evento_id=?', [id]);
    await conn.query('DELETE FROM eventos_lugar WHERE id=?', [id]);

    await conn.commit();

    for (const f of fotos) {
      try { fs.unlinkSync(filePathFromUrl(f.imagen_url)); } catch {}
    }

    res.json({ ok: true, eliminado: id });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    console.error(e);
    res.status(500).json({ error: 'Error eliminando evento' });
  } finally {
    conn.release();
  }
});

export const eventosRouter = router;
