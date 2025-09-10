/*APP.JSX - MANEJO DE RUTAS DE LA APLICACIÓN*/

import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Index.css';

/* Componentes – Usuario */
import Inicio from './Components/Usuarios/Inicio';
import Departamentos from './Components/Usuarios/Departamentos.jsx';
import Municipios from './Components/Usuarios/Municipios.jsx';
import PublicacionDetalle from './Components/Usuarios/PublicacionDetalle.jsx';

/* Componentes – Administrador */
import Admin from './Components/Administrador/Admin';
import AdminPublicaciones from './Components/Administrador/AdminPublicaciones.jsx';

/* Componentes – Empresa */
import InicioEmpresa from './Components/Empresa/InicioEmpresa';
import PerfilEmpresa from './Components/Empresa/PerfilEmpresa.jsx';
import EventosLugar from './Components/Empresa/EventosLugar.jsx';
import ValoracionesLugar from './Components/Empresa/ValoracionesLugar.jsx';
import EditarPublicacion from "./Components/Empresa/EditarPublicacion.jsx";

/* Componentes – Públicos */
import Login from './Components/Publica/Login';
import Registro from './Components/Publica/Registro';
import NotFound from './Components/Publica/NotFound';
import ProtectedRoute from './Components/Publica/PrivateRoute';
import Navbar from './Components/Publica/Navbar';
import Footer from './Components/Publica/Footer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/userlogin" replace />} />

        {/* PÚBLICAS */}
        <Route path="/userlogin" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />

        {/* ADMIN (sin Navbar, como lo tienes) */}
        <Route
          path="/Admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/AdminPublicaciones"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPublicaciones />
            </ProtectedRoute>
          }
        />

        {/* EMPRESA: ahora con Navbar */}
        <Route element={<LayoutWithoutFooter />}>
        <Route element={<LayoutWithNavbar />}>
          <Route
            path="/InicioEmpresa"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <InicioEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/PerfilEmpresa"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <PerfilEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/PerfilEmpresa/:id"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <PerfilEmpresa />
              </ProtectedRoute>
            }
          />
          <Route
            path="/EventosLugar"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <EventosLugar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/EventosLugar/:id"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <EventosLugar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/empresa/editar-publicacion/:id"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <EditarPublicacion />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* USUARIOS: con Navbar (como ya tenías) y sin Footer en estas vistas intermedias */}
        
          <Route element={<LayoutWithNavbar />}>
            <Route
              path="/Inicio"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <Inicio />
                </ProtectedRoute>
              }
            />
            <Route
              path="/publicacion/:id"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <PublicacionDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departamentos/:deptSlug/:muniSlug"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <Municipios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ValorarLugar"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <ValoracionesLugar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/departamentos/:slug"
              element={
                <ProtectedRoute allowedRoles={['USER']}>
                  <Departamentos />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="colored"
      />
    </Router>
  );
}

// Layout con Navbar
function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

// Layout con Footer
function LayoutWithoutFooter() {
  return (
    <>
      <Outlet />
      <Footer />
    </>
  );
}

export default App;
