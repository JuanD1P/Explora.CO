import React, { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3000'; // backend

const Inicio = () => {
  const [titulo, setTitulo] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [loading, setLoading] = useState(false);

  const cargarImagenes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/imagenes`, { credentials: 'include' });
      const data = await res.json();
      setImagenes(data);
    } catch (e) {
      console.error(e);
      alert('Error cargando imágenes');
    }
  };

  useEffect(() => {
    cargarImagenes();
  }, []);

  const onFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Selecciona una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('imagen', file); // 👈 debe llamarse "imagen"

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/imagenes`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Error al subir la imagen');

      // limpiar formulario
      setTitulo('');
      setFile(null);
      setPreview(null);

      // recargar lista
      await cargarImagenes();
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Explora.co — Publicaciones con imagen</h2>

      <form onSubmit={onSubmit} style={{
        display: 'grid', gap: 12, padding: 12, border: '1px solid #ddd',
        borderRadius: 10, marginBottom: 24
      }}>
        <input
          type="text"
          placeholder="Título (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          style={{ padding: 8 }}
        />
        {preview && (
          <div>
            <p style={{ margin: '4px 0' }}>Vista previa:</p>
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: '100%', borderRadius: 8 }}
            />
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 14px', borderRadius: 8, border: 'none',
            background: '#2563eb', color: '#fff', cursor: 'pointer'
          }}
        >
          {loading ? 'Subiendo...' : 'Subir imagen'}
        </button>
      </form>

      <h3 style={{ marginBottom: 8 }}>Últimas imágenes</h3>
      {!imagenes.length && <p>No hay imágenes aún.</p>}

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'
        }}
      >
        {imagenes.map((img) => (
          <article key={img.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {img.titulo || 'Sin título'}
            </div>
            <img
              src={`${API_URL}${img.imagen_url}`} // ej: http://localhost:3000/uploads/xxxx.jpg
              alt={img.alt_text || img.titulo || 'imagen'}
              style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }}
              loading="lazy"
            />
          </article>
        ))}
      </div>
    </div>
  );
};

export default Inicio;
