import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Index.css';

import Login from './Components/Login';
import Registro from './Components/Registro';
import Inicio from './Components/Inicio';
import NotFound from './Components/NotFound';
import ProtectedRoute from './Components/PrivateRoute';
import Admin from './Components/Admin';
import Navbar from './Components/Navbar';
import InicioEmpresa from './Components/InicioEmpresa';
import PerfilEmpresa from './Components/PerfilEmpresa.jsx';
import EventosLugar from './Components/EventosLugar.jsx';
import ValoracionesLugar from './Components/ValoracionesLugar.jsx';


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirección inicial */}
        <Route path="/" element={<Navigate to="/userlogin" replace />} />

        {/* PÚBLICAS */}
        <Route path="/userlogin" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />

        {/* ADMIN */}
        <Route
          path="/Admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* EMPRESAS */}
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
          path="/EventosLugar"
          element={
            <ProtectedRoute allowedRoles={['EMPRESA']}>
              <EventosLugar />
            </ProtectedRoute>
          }
        />

        {/* USUARIOS (con Navbar) */}
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
            path="/ValorarLugar"
            element={
            <ProtectedRoute allowedRoles={['USER']}>
            <ValoracionesLugar />
            </ProtectedRoute>
           }
          />


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

export default App;
