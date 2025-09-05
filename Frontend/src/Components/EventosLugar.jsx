import React, { useEffect, useRef, useState } from "react";
import "./DOCSS/PerfilEmpresa.css"; 


const API_URL = "http://localhost:3000";
const EMPRESA_ID = 3;

// Validación simple
const MAX_MB = 10;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function EventosLugar() {
  const [lugares, setLugares] = useState([]);
  const [perfilId, setPerfilId] = useState("");
  const [nombreEvento, setNombreEvento] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Fotos
  const [fotoPrincipal, setFotoPrincipal] = useState(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState(null);
  const principalInputRef = useRef(null);

  const [fotosExtra, setFotosExtra] = useState([]);
  const addExtraInputRef = useRef(null);

  const [enviando, setEnviando] = useState(false);
  const [eventos, setEventos] = useState([]);

  // ===== helpers =====
  const fileIsOk = (f) => {
    const okType = ACCEPTED.includes(f.type);
    const okSize = f.size <= MAX_MB * 1024 * 1024;
    if (!okType) alert("Solo se permiten JPG, PNG o WEBP.");
    if (!okSize) alert(`El archivo supera ${MAX_MB}MB.`);
    return okType && okSize;
  };

  // ===== fetch =====
  const cargarLugares = async () => {
    const res = await fetch(`${API_URL}/api/perfiles?empresa_id=${EMPRESA_ID}`, { credentials: "include" });
    const data = await res.json();
    setLugares(data || []);
    if (data?.length && !perfilId) setPerfilId(String(data[0].id));
  };

  const cargarEventos = async (pid = null) => {
    const url = pid
      ? `${API_URL}/api/eventos?empresa_id=${EMPRESA_ID}&perfil_id=${pid}`
      : `${API_URL}/api/eventos?empresa_id=${EMPRESA_ID}`;
    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();
    setEventos(data || []);
  };

  React.useEffect(() => { cargarLugares(); }, []);
  React.useEffect(() => { if (perfilId) cargarEventos(perfilId); }, [perfilId]);

  // ===== handlers fotos =====
  const onPickPrincipal = (fileOrEvent) => {
    const file = fileOrEvent?.target ? (fileOrEvent.target.files?.[0] || null) : fileOrEvent;
    if (!file || !fileIsOk(file)) return;
    setFotoPrincipal(file);
    setFotoPrincipalPreview(URL.createObjectURL(file));
  };

  const onAddExtraFromHidden = (e) => {
    const f = e.target.files?.[0] || null;
    if (!f || !fileIsOk(f)) return;
    setFotosExtra((prev) => [...prev, { file: f, preview: URL.createObjectURL(f) }]);
    e.target.value = "";
  };

  const removeExtraAt = (i) => setFotosExtra((prev) => prev.filter((_, idx) => idx !== i));

  // ===== submit =====
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!perfilId) return alert("Selecciona un lugar");
    if (!nombreEvento.trim()) return alert("Ingresa el nombre del evento");

    const fd = new FormData();
    fd.append("empresa_id", String(EMPRESA_ID));
    fd.append("perfil_id", perfilId);
    fd.append("nombre_evento", nombreEvento.trim());
    fd.append("descripcion", descripcion);
    if (fotoPrincipal) fd.append("fotos", fotoPrincipal);
    fotosExtra.forEach(({ file }) => fd.append("fotos", file));

    try {
      setEnviando(true);
      const res = await fetch(`${API_URL}/api/eventos`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error creando evento");

      // limpiar
      setNombreEvento("");
      setDescripcion("");
      setFotoPrincipal(null);
      setFotoPrincipalPreview(null);
      setFotosExtra([]);
      await cargarEventos(perfilId);
      alert("Evento creado");
    } catch (err) {
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="pe-root">
      {/* HEADER */}
      <header className="pe-header glass card-3d" style={{ maxWidth: 1000 }}>
        <div className="pe-header__left">
          <span className="pe-logo" aria-hidden>🎉</span>
          <div>
            <h1>Eventos del lugar</h1>
            <p>Crea y gestiona eventos para tus lugares!!</p>
          </div>
        </div>
      </header>

      {/* FORM */}
      <form onSubmit={onSubmit} className="pe-form card-3d" style={{ maxWidth: 1000, gridTemplateColumns: "1fr" }}>
        <div className="pe-block">
          <div className="pe-block__head">
            <h3>Información del evento</h3>
            <p>Selecciona el lugar y define los datos básicos</p>
          </div>

          <div className="field">
            <label>Lugar *</label>
            <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
              {lugares.length === 0 && <option value="">No tienes lugares. Crea uno primero.</option>}
              {lugares.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre_lugar} — {l.ciudad}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Nombre del evento *</label>
            <input
              type="text"
              value={nombreEvento}
              onChange={(e) => setNombreEvento(e.target.value)}
              placeholder="Ej: Festival del Café 2025"
            />
          </div>

          <div className="field">
            <label>Descripción</label>
            <textarea
              rows={4}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles del evento, invitados, programación, etc."
            />
          </div>
        </div>

        <div className="pe-block">
          <div className="pe-block__head">
            <h3>Fotos del evento</h3>
            <p>La imagen atrae más visitas</p>
          </div>

          {/* Foto principal: DROPZONE */}
          <div className="field">
            <label>Foto principal</label>

            {!fotoPrincipalPreview ? (
              <div
                className="pe-dropzone"
                onClick={() => principalInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onPickPrincipal(f);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && principalInputRef.current?.click()}
              >
                <div className="pe-dropzone__icon">📷</div>
                <div className="pe-dropzone__text">
                  <strong>Arrastra una imagen aquí</strong>
                  <span>o</span>
                  <button type="button" className="btn btn-outline">Selecciona una imagen</button>
                </div>
                <small className="pe-hint">JPG/PNG/WEBP • máx. {MAX_MB}MB</small>

                {/* input file nativo oculto */}
                <input
                  ref={principalInputRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  onChange={onPickPrincipal}
                  hidden
                />
              </div>
            ) : (
              <div className="pe-photo-main">
                <img src={fotoPrincipalPreview} alt="principal" />
                <div className="pe-photo-actions">
                  <button type="button" className="btn btn-outline" onClick={() => principalInputRef.current?.click()}>
                    Cambiar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setFotoPrincipal(null);
                      setFotoPrincipalPreview(null);
                    }}
                  >
                    Quitar
                  </button>

                  <input
                    ref={principalInputRef}
                    type="file"
                    accept={ACCEPTED.join(",")}
                    onChange={onPickPrincipal}
                    hidden
                  />
                </div>
              </div>
            )}
          </div>

          {/* Más fotos */}
          <div className="field">
            <label>Más fotos (opcional)</label>

            <div className="pe-gallery">
              {fotosExtra.map((f, i) => (
                <div key={i} className="pe-thumb">
                  <img src={f.preview} alt={`extra-${i}`} />
                  <button
                    type="button"
                    className="pe-thumb__remove"
                    title="Quitar"
                    onClick={() => removeExtraAt(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div
              className="file-btn"
              onClick={() => addExtraInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && addExtraInputRef.current?.click()}
            >
              <span className="file-btn__icon">➕</span>
              <span className="file-btn__label">Agregar otra foto</span>
            </div>

            <input
              ref={addExtraInputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={onAddExtraFromHidden}
              hidden
            />
          </div>
        </div>

        <div className="pe-actions">
          <button type="submit" className="btn btn-primary btn-lg" disabled={enviando}>
            {enviando ? "Guardando..." : "Crear evento"}
          </button>
        </div>
      </form>

      {/* Lista de eventos */}
      {Array.isArray(eventos) && eventos.length > 0 && (
        <section className="pe-list card-3d" style={{ maxWidth: 1000 }}>
          <h4 className="pe-list__title">Eventos creados</h4>
          <ul className="pe-list__ul">
            {eventos.map((ev) => (
              <li key={ev.id}>
                <strong>{ev.nombre_evento}</strong>
                <span>#{ev.id}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
