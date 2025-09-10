/*VISTA PARA CREAR VALORACIONES DE UN LUGAR*/

import React, { useEffect, useState } from 'react';
const API_URL = 'http://localhost:3000';

const USER_ID = 14;

export default function ValoracionesLugar() {
  const [lugares, setLugares] = useState([]);
  const [perfilId, setPerfilId] = useState('');
  const [estrellas, setEstrellas] = useState(0);
  const [hover, setHover] = useState(0);
  const [comentario, setComentario] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [lista, setLista] = useState([]);
  const [summary, setSummary] = useState({ total: 0, promedio: null });

  const cargarLugares = async () => {
    const res = await fetch(`${API_URL}/api/perfiles`);
    const data = await res.json();
    setLugares(data);
    if (data.length && !perfilId) setPerfilId(String(data[0].id));
  };

  const cargarValoraciones = async (pid) => {
    const [r1, r2] = await Promise.all([
      fetch(`${API_URL}/api/valoraciones?perfil_id=${pid}`),
      fetch(`${API_URL}/api/valoraciones/summary?perfil_id=${pid}`)
    ]);
    setLista(await r1.json());
    setSummary(await r2.json());
  };

  useEffect(() => { cargarLugares(); }, []);
  useEffect(() => { if (perfilId) cargarValoraciones(perfilId); }, [perfilId]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!perfilId) return alert('Selecciona un lugar');
    if (estrellas < 1) return alert('Selecciona una calificación');
    try {
      setEnviando(true);
      const res = await fetch(`${API_URL}/api/valoraciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          perfil_id: Number(perfilId),
          usuario_id: USER_ID,
          estrellas,
          comentario
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo enviar la valoración');
      setComentario('');
      await cargarValoraciones(perfilId);
      alert('¡Gracias por tu valoración!');
    } catch (e2) {
      alert(e2.message);
    } finally {
      setEnviando(false);
    }
  };

  const Star = ({ i }) => (
    <button
      type="button"
      onMouseEnter={() => setHover(i)}
      onMouseLeave={() => setHover(0)}
      onClick={() => setEstrellas(i)}
      aria-label={`${i} estrella${i > 1 ? 's' : ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontSize: 28,
        lineHeight: 1,
        color: (hover || estrellas) >= i ? '#f59e0b' : '#d1d5db'
      }}
    >
      ★
    </button>
  );

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Valorar lugares</h2>

      <form onSubmit={enviar} style={{ display: 'grid', gap: 12, border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, marginBottom: 24 }}>
        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Lugar</label>
          <select value={perfilId} onChange={e => setPerfilId(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}>
            {lugares.map(l => <option key={l.id} value={l.id}>{l.nombre_lugar} — {l.ciudad}</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Tu calificación</label>
          <div role="radiogroup" aria-label="Calificación">
            {[1,2,3,4,5].map(i => <Star key={i} i={i} />)}
          </div>
          {estrellas > 0 && <small style={{ opacity: .7 }}>Seleccionadas: {estrellas} ⭐</small>}
        </div>

        <textarea
          placeholder="Escribe un comentario (opcional pero útil para otros viajeros)"
          rows={3}
          value={comentario}
          onChange={e => setComentario(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />

        <button type="submit" disabled={enviando}
          style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer' }}>
          {enviando ? 'Enviando...' : 'Enviar valoración'}
        </button>
      </form>

      <section style={{ marginBottom: 16 }}>
        <h3 style={{ marginBottom: 6 }}>Resumen</h3>
        {summary.total ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{summary.promedio}</div>
            <div>
              {[1,2,3,4,5].map(i => (
                <span key={i} style={{ color: (summary.promedio || 0) >= i ? '#f59e0b' : '#d1d5db', fontSize: 18 }}>★</span>
              ))}
            </div>
            <div style={{ fontSize: 13, opacity: .7 }}>({summary.total} valoraciones)</div>
          </div>
        ) : <p>Aún no hay valoraciones para este lugar.</p>}
      </section>

      <h3 style={{ marginBottom: 6 }}>Comentarios</h3>
      {!lista.length && <p>Se el primero en comentar.</p>}
      <div style={{ display: 'grid', gap: 10 }}>
        {lista.map(v => (
          <div key={v.id} style={{ border: '1px solid #eee', borderRadius: 10, padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <strong>{v.nombre_completo || 'Usuario'}</strong>
              <span style={{ fontSize: 12, opacity: .7 }}>
                {new Date(v.updated_at).toLocaleString()}
              </span>
            </div>
            <div style={{ color: '#f59e0b', marginBottom: 6 }}>
              {'★'.repeat(v.estrellas)}
              <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - v.estrellas)}</span>
            </div>
            {v.comentario && <p style={{ margin: 0 }}>{v.comentario}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
