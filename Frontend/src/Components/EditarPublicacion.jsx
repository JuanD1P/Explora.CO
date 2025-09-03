import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./DOCSS/InicioEmpresa.css";


const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

const EditarPublicacion = () => {
  const { id } = useParams(); // id de la publicación
  const navigate = useNavigate();

  const [form, setForm] = useState({
    titulo: "",
    desc: "",
  });
  const [loading, setLoading] = useState(true);

  // Cargar datos de la publicación
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/perfiles/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la publicación");
        const data = await res.json();
        setForm({
          titulo: data.nombre_lugar || "",
          desc: data.descripcion || "",
        });
      } catch (e) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/perfiles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_lugar: form.titulo,
          descripcion: form.desc,
        }),
      });
      if (!res.ok) throw new Error("Error al actualizar la publicación");
      alert("Publicación actualizada con éxito ✅");
      navigate("/InicioEmpresa");
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Cargando publicación...</p>;

  return (
    <main className="emp-root">
      <section className="emp-hero card-3d">
        <h2 className="emp-hero-title">Editar Publicación</h2>
        <form onSubmit={handleSubmit} className="glass" style={{ padding: 20 }}>
          <div style={{ marginBottom: "12px" }}>
            <label>Título</label>
            <input
              type="text"
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              required
              style={{ width: "100%", padding: "8px", borderRadius: "8px" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Descripción</label>
            <textarea
              name="desc"
              value={form.desc}
              onChange={handleChange}
              required
              rows="4"
              style={{ width: "100%", padding: "8px", borderRadius: "8px" }}
            />
          </div>

          <button type="submit" className="emp-create-btn">
            Guardar Cambios
          </button>
        </form>
      </section>
    </main>
  );
};

export default EditarPublicacion;
