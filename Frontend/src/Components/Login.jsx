import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from '../ImagenesP/ImagenesLogin/LOGOCO.png';
import './DOCSS/Login.css';

const Login = () => {
    const [values, setValues] = useState({
        email: '',
        password: ''
    });
    
    localStorage.clear();

    localStorage.removeItem('auth-token');
    localStorage.removeItem('user-role');
    localStorage.removeItem('municipioSeleccionado');
    localStorage.removeItem('fechaSeleccionada');
    const [error, setError] = useState(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const navigate = useNavigate();
    axios.defaults.withCredentials = true;

    const handleSubmit = (event) => {
        event.preventDefault();
        setError(null);
    
        if (!values.email || !values.password) {
            setError('Todos los campos deben ser completados');
            return;
        }
    
        axios.post('http://localhost:3000/auth/userlogin', values)
        .then(result => {
            console.log("Respuesta del backend:", result.data);
    
            if (result.data.loginStatus) {
                if (result.data.token) {  
                    localStorage.setItem('auth-token', result.data.token);
                }
                localStorage.setItem('user-role', result.data.role);
                console.log("Token guardado:", localStorage.getItem("auth-token"));
                console.log("Rol guardado:", localStorage.getItem("user-role"));
                
    
                if (result.data.role === 'USER') {
                    navigate('/Inicio');
                    window.location.reload();
                } else if (result.data.role === 'ADMIN') {
                    navigate('/Admin');
                    window.location.reload();
                }
            } else {
                setError(result.data.Error);
            }
        })
        .catch(err => {
            console.error("Error en la petición:", err);
            setError("Error en el servidor. Inténtalo de nuevo.");
        });
    
    
    };
    
    return (
        <div className="login-container">
  <div className="login-card">
    <img src={logo} alt="Logo" className="login-logo" />
    
    <div className={`login-error ${error ? 'show' : ''}`}>
      {error && error}
    </div>

    <form onSubmit={handleSubmit} className="login-form">
      <input 
        type="email"
        placeholder="Ingresa Email"
        onChange={(e) => setValues({ ...values, email: e.target.value })}
      />
      <input 
        type="password"
        placeholder="Ingresa Contraseña"
        onChange={(e) => setValues({ ...values, password: e.target.value })}
      />
      <button type="submit" className="login-btn">Ingresa</button>
    </form>

    <button onClick={() => navigate('/Registro')} className="login-btn-secondary">
      Ir a Registro
    </button>
  </div>
</div>

    );
};

export default Login;
