import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "@sweetalert2/themes/borderless/borderless.css";
import logo from "../ImagenesP/ImagenesLogin/ADMINLOGO.png";
import "./DOCSS/Admin.css";

axios.defaults.withCredentials = true;

const authApi = axios.create({
  baseURL: "http://localhost:3000/auth",
  withCredentials: true,
});

export default function Admin() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [uLoading, setULoading] = useState(false);
  const [uErr, setUErr] = useState("");

  useEffect(() => { obtenerUsuarios(); }, []);

  const obtenerUsuarios = async () => {
    try {
      setULoading(true);
      setUErr("");
      const { data } = await authApi.get("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      setUErr(error?.response?.data?.error || "No fue posible cargar los usuarios");
    } finally {
      setULoading(false);
    }
  };

  const eliminarUsuario = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, no eliminar",
      reverseButtons: true,
      focusCancel: true,
      showLoaderOnConfirm: true,
      buttonsStyling: false,
      customClass: {
        popup: "sw-popup",
        title: "sw-title",
        htmlContainer: "sw-text",
        actions: "sw-actions",
        confirmButton: "sw-confirm",
        cancelButton: "sw-cancel",
      },
      preConfirm: async () => {
        try { await authApi.delete(`/usuarios/${id}`); }
        catch (error) {
          Swal.showValidationMessage(
            error?.response?.data?.error || "No fue posible eliminar el usuario"
          );
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (result.isConfirmed) {
      await obtenerUsuarios();
      Swal.fire({
        icon: "success",
        title: "Usuario eliminado",
        timer: 1400,
        showConfirmButton: false,
        customClass: { popup: "sw-popup" },
        buttonsStyling: false,
      });
    }
  };

  const cambiarRol = async (id, rolActual, nuevoRol) => {
    if (rolActual === nuevoRol) return;
    const { isConfirmed } = await Swal.fire({
      title: "Cambiar rol",
      text: `¿Deseas cambiar el rol a ${nuevoRol}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "No, no cambiar",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "sw-popup",
        title: "sw-title",
        htmlContainer: "sw-text",
        actions: "sw-actions",
        confirmButton: "sw-confirm",
        cancelButton: "sw-cancel",
      },
    });
    if (!isConfirmed) return;

    try {
      await authApi.put(`/usuarios/${id}/rol`, { rol: nuevoRol });
      await obtenerUsuarios();
      Swal.fire({
        icon: "success",
        title: "Rol actualizado",
        timer: 1200,
        showConfirmButton: false,
        customClass: { popup: "sw-popup" },
        buttonsStyling: false,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "No fue posible cambiar el rol",
        text: error?.response?.data?.error || "Intenta de nuevo",
        customClass: { popup: "sw-popup" },
        buttonsStyling: false,
      });
    }
  };

  const { admins, users, empresas } = useMemo(() => ({
    admins: usuarios.filter(u => u.rol === "ADMIN"),
    users: usuarios.filter(u => u.rol === "USER"),
    empresas: usuarios.filter(u => u.rol === "EMPRESA"),
  }), [usuarios]);

  const TablaSegmento = ({ titulo, items, emptyText, color }) => (
    <section className={`card glass-strong segment segment-${color}`}>
      <div className="card-head">
        <h2>{titulo}</h2>
        <div className="chip">{uLoading ? "Cargando..." : `${items.length}`}</div>
      </div>

      {uErr && <div className="alert error">{uErr}</div>}

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>NOMBRE</th>
              <th>EMAIL</th>
              <th>ROL</th>
              <th style={{ minWidth: 120 }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {uLoading ? (
              <tr>
                <td colSpan={5}>
                  <div className="skeleton-row" />
                  <div className="skeleton-row" />
                  <div className="skeleton-row" />
                </td>
              </tr>
            ) : items.length ? (
              items.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td className="cell-strong">{u.nombre_completo}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="admin-role-select"
                      value={u.rol}
                      onChange={(e) => cambiarRol(u.id, u.rol, e.target.value)}
                      title="Cambiar rol"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="EMPRESA">EMPRESA</option>
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn danger"
                      onClick={() => eliminarUsuario(u.id)}
                      title="Eliminar usuario"
                    >
                      <span className="x">✖</span> Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="cell-empty">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="admin-page">
      <div className="admin-overlay" />

      <header className="admin-header glass-strong">
        <div className="admin-header-left">
          <img src={logo} alt="Logo" className="admin-logo" />
          <div>
            <h1 className="admin-title">Panel de Administración</h1>
            <p className="admin-subtitle">Gestión de usuarios</p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button onClick={() => navigate("/")} className="btn accent">
            VER PUBLICACIONES
          </button>
        </div>
      </header>

      <main className="admin-content">
        <div className="segments-stack">
          <TablaSegmento
            titulo="Admins"
            items={admins}
            emptyText="No hay administradores"
            color="admin"
          />
          <TablaSegmento
            titulo="Usuarios"
            items={users}
            emptyText="No hay usuarios"
            color="user"
          />
          <TablaSegmento
            titulo="Empresas"
            items={empresas}
            emptyText="No hay empresas"
            color="empresa"
          />
        </div>
      </main>
    </div>
  );
}
