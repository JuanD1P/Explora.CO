import { Router } from 'express';
import con from '../utils/db.js';

const router = Router();


function q(sql, params = []) {
  return new Promise((resolve, reject) => {
    con.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

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

    // valida rol
    const u = await q('SELECT rol FROM usuarios WHERE id = ?', [usuario_id]);
    if (!u.length || u[0].rol !== 'USER') {
      return res.status(403).json({ error: 'Solo los usuarios pueden valorar' });
    }

    // valida perfil
    const p = await q('SELECT id FROM perfilempresa WHERE id = ?', [perfil_id]);
    if (!p.length) return res.status(404).json({ error: 'Lugar no encontrado' });

    // inserta o actualiza
    await q(
      `INSERT INTO valoraciones (perfil_id, usuario_id, estrellas, comentario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         estrellas = VALUES(estrellas),
         comentario = VALUES(comentario),
         updated_at = CURRENT_TIMESTAMP`,
      [perfil_id, usuario_id, e, comentario || null]
    );

    res.status(201).json({ message: 'Valoración registrada' });
  } catch (err) {
    console.error('POST /valoraciones error:', err);
    res.status(500).json({ error: 'Error guardando valoración' });
  }
});


router.get('/valoraciones', async (req, res) => {
  try {
    const perfilId = Number(req.query.perfil_id);
    if (!perfilId) return res.status(400).json({ error: 'perfil_id requerido' });

    const rows = await q(
      `SELECT v.*, u.nombre_completo
         FROM valoraciones v
         JOIN usuarios u ON u.id = v.usuario_id
        WHERE v.perfil_id = ?
        ORDER BY v.updated_at DESC`,
      [perfilId]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /valoraciones error:', err);
    res.status(500).json({ error: 'Error listando valoraciones' });
  }
});

/** Resumen  */
router.get('/valoraciones/summary', async (req, res) => {
  try {
    const perfilId = Number(req.query.perfil_id);
    if (!perfilId) return res.status(400).json({ error: 'perfil_id requerido' });

    const aggRows = await q(
      'SELECT COUNT(*) AS total, AVG(estrellas) AS promedio FROM valoraciones WHERE perfil_id = ?',
      [perfilId]
    );
    const agg = aggRows[0] || { total: 0, promedio: null };


    const distRows = await q(
      `SELECT estrellas, COUNT(*) AS c
         FROM valoraciones
        WHERE perfil_id = ?
        GROUP BY estrellas`,
      [perfilId]
    );

    const dist = { 1:0, 2:0, 3:0, 4:0, 5:0 };
    for (const r of distRows) {
      const star = Number(r.estrellas);
      if (star >= 1 && star <= 5) dist[star] = Number(r.c || 0);
    }

    res.json({
      total: Number(agg.total || 0),
      promedio: agg.promedio != null ? Math.round(Number(agg.promedio) * 100) / 100 : null,
      dist
    });
  } catch (err) {
    console.error('GET /valoraciones/summary error:', err);
    res.status(500).json({ error: 'Error calculando resumen' });
  }
});

/** Eliminar valoración propia*/
router.delete('/valoraciones/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { usuario_id } = req.body || {};
    if (!id || !usuario_id) {
      return res.status(400).json({ error: 'id de la valoración y usuario_id requeridos' });
    }

    const chk = await q('SELECT id FROM valoraciones WHERE id = ? AND usuario_id = ?', [id, usuario_id]);
    if (!chk.length) return res.status(404).json({ error: 'Valoración no encontrada o no pertenece al usuario' });

    await q('DELETE FROM valoraciones WHERE id = ?', [id]);
    res.json({ message: 'Valoración eliminada' });
  } catch (err) {
    console.error('DELETE /valoraciones/:id error:', err);
    res.status(500).json({ error: 'Error eliminando valoración' });
  }
});

export const valoracionesRouter = router;
