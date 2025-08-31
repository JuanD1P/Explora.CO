import { Router } from 'express';
import mysql from 'mysql2/promise';

const router = Router();

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'exploraco',
  waitForConnections: true,
  connectionLimit: 10,
});

// POST /api/valoraciones  (crear/actualizar)
// body: { perfil_id, usuario_id, estrellas, comentario? }
router.post('/valoraciones', async (req, res) => {
  try {
    const { perfil_id, usuario_id, estrellas, comentario } = req.body;

    if (!perfil_id || !usuario_id || !estrellas) {
      return res.status(400).json({ error: 'perfil_id, usuario_id y estrellas son requeridos' });
    }
    const e = Number(estrellas);
    if (e < 1 || e > 5) {
      return res.status(400).json({ error: 'estrellas debe estar entre 1 y 5' });
    }

    // (Opcional) validar que el usuario sea rol USER
    const [u] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [usuario_id]);
    if (!u.length || u[0].rol !== 'USER') {
      return res.status(403).json({ error: 'Solo los usuarios pueden valorar' });
    }

    // validar que el lugar exista
    const [p] = await pool.query('SELECT id FROM perfilempresa WHERE id = ?', [perfil_id]);
    if (!p.length) return res.status(404).json({ error: 'Lugar no encontrado' });

    // upsert (si ya valoró, se actualiza)
    await pool.query(
      `INSERT INTO valoraciones (perfil_id, usuario_id, estrellas, comentario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE estrellas = VALUES(estrellas), comentario = VALUES(comentario), updated_at = CURRENT_TIMESTAMP`,
      [perfil_id, usuario_id, e, comentario || null]
    );

    res.status(201).json({ message: 'Valoración registrada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error guardando valoración' });
  }
});

// GET /api/valoraciones?perfil_id=123  (lista de comentarios)
router.get('/valoraciones', async (req, res) => {
  try {
    const perfilId = Number(req.query.perfil_id);
    if (!perfilId) return res.status(400).json({ error: 'perfil_id requerido' });

    const [rows] = await pool.query(
      `SELECT v.*, u.nombre_completo
         FROM valoraciones v
         JOIN usuarios u ON u.id = v.usuario_id
        WHERE v.perfil_id = ?
        ORDER BY v.updated_at DESC`,
      [perfilId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error listando valoraciones' });
  }
});

// GET /api/valoraciones/summary?perfil_id=123  (promedio y conteo)
router.get('/valoraciones/summary', async (req, res) => {
  try {
    const perfilId = Number(req.query.perfil_id);
    if (!perfilId) return res.status(400).json({ error: 'perfil_id requerido' });

    const [[agg]] = await pool.query(
      'SELECT COUNT(*) AS total, AVG(estrellas) AS promedio FROM valoraciones WHERE perfil_id = ?',
      [perfilId]
    );

    res.json({
      total: Number(agg.total || 0),
      promedio: agg.promedio ? Number(agg.promedio).toFixed(2) : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error calculando promedio' });
  }
});

export const valoracionesRouter = router;
