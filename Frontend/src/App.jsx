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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/userlogin" />} />
        <Route path="/userlogin" element={<Login />} />
        <Route path="/Registro" element={<Registro />} />

        {/* RUTAS PARA EL ADMINISTRADOR */}
        <Route
          path="/Admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* RUTAS PARA LAS EMPRESAS */}
          <Route
            path="/InicioEmpresa"
            element={
              <ProtectedRoute allowedRoles={['EMPRESA']}>
                <InicioEmpresa />
              </ProtectedRoute>
            }
          />


        {/* RUTAS PARA LOS USUARIOS */}
        <Route element={<LayoutWithNavbar />}>
          <Route
            path="/Inicio"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <Inicio />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* RUTA NO ENCONTRADA */}
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

// Navbar
function LayoutWithNavbar() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default App;
