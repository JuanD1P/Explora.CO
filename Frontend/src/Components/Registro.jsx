import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast } from 'react-toastify';
import './DOCSS/Registro.css';
import logo from '../ImagenesP/ImagenesLogin/LOGOCO.png';

const Registro = () => {
  const [values, setValues] = useState({
    rol: 'USER',                
    nombre_completo: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: ''              
  });

  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [flip, setFlip] = useState('');
  const navigate = useNavigate();
  axios.defaults.withCredentials = true;

  const set = (k) => (e) => setValues(v => ({ ...v, [k]: e.target.value }));

  const handleRole = (rol) => {
    setFlip(rol === 'EMPRESA' ? 'flip-right' : 'flip-left');
    setTimeout(() => setFlip(''), 450);

    setValues(v => ({
      ...v,
      rol,
      telefono: rol === 'EMPRESA' ? v.telefono : ''
    }));
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();           
    setError(null);                   


    const fail = (msg) => { setError(msg); toast.warn(msg); };


    if (!values.nombre_completo || !values.email || !values.password || !values.confirmPassword)
      return fail("Todos los campos marcados con * son obligatorios");

    if (!values.email.includes('@'))
      return fail("El correo debe contener un '@'");

    if (values.password.length < 6)
      return fail("La contraseña debe tener al menos 6 caracteres");

    if (!/[A-Za-z]/.test(values.password))
      return fail("La contraseña debe contener al menos una letra");

    if (!/\d/.test(values.password))
      return fail("La contraseña debe contener al menos un número");

    if (values.password !== values.confirmPassword)
      return fail("Las contraseñas no coinciden");

    if (values.rol === 'EMPRESA' && !values.telefono)
      return fail("Para empresas, el teléfono es obligatorio");

    const payload = {
      rol: values.rol,
      nombre_completo: values.nombre_completo,
      email: values.email,
      password: values.password,
      ...(values.rol === 'EMPRESA' ? { telefono: values.telefono } : {})
    };

    try {
      const result = await axios.post('http://localhost:3000/auth/register', payload);

      if (result?.data?.registrationStatus) {
        toast.success("Registro exitoso");
        navigate('/userlogin');
      } else {
        const msg = result?.data?.Error || "No se pudo completar el registro";
        setError(msg);
        toast.error(`⚠️ ${msg}`);
      }
    } catch (err) {
      console.error("Error en el registro:", err);
      setError("Error en el servidor, intenta más tarde");
      toast.error("💥 Error en el servidor, intenta más tarde");
    }
  };


  const thumbX = useMemo(() => (values.rol === 'EMPRESA' ? 0 : 1), [values.rol]);

  return (
    <div className="registro-container">

      <div aria-live="polite" className="sr-only">{error}</div>

      <form noValidate onSubmit={handleSubmit} className="form-container">

        <div className={`card-inner ${flip}`}>
          <div className="headerForm">
            <img src={logo} alt="Logo" className="loginlogo" />
            <p>Completa el formulario ({values.rol === 'EMPRESA' ? 'empresa' : 'usuario'})</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Tipo de registro" data-pos={thumbX}>
            <span className="segmented-thumb" aria-hidden="true" />
            <button
              type="button"
              role="tab"
              aria-selected={values.rol === 'EMPRESA'}
              className={`segmented-btn ${values.rol === 'EMPRESA' ? 'active' : ''}`}
              onClick={() => handleRole('EMPRESA')}
            >
              Soy empresa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={values.rol === 'USER'}
              className={`segmented-btn ${values.rol === 'USER' ? 'active' : ''}`}
              onClick={() => handleRole('USER')}
            >
              Soy usuario
            </button>
          </div>

          <div className="fields-viewport">
            <div className={`fields-page ${values.rol === 'EMPRESA' ? 'page-empresa' : 'page-user'}`}>
              <input
                type="text"
                value={values.nombre_completo}
                onChange={set('nombre_completo')}
                placeholder="Nombre completo del contacto *"
                required
              />

              {values.rol === 'EMPRESA' && (
                <input
                  type="tel"
                  value={values.telefono}
                  onChange={set('telefono')}
                  placeholder="Teléfono de la empresa *"
                  required
                />
              )}

              {/* Email */}
              <input
                type="email"
                value={values.email}
                onChange={set('email')}
                placeholder="Email *"
                required
              />

              <div className="password-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={set('password')}
                  placeholder="Contraseña *"
                  required
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword(s => !s)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>

              <div className="password-container">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={values.confirmPassword}
                  onChange={set('confirmPassword')}
                  placeholder="Confirmar contraseña *"
                  required
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowConfirmPassword(s => !s)}
                  aria-label={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary">Registrarse</button>
          <button type="button" onClick={() => navigate('/userlogin')} className='botonLogin1'>
            Inicia sesión
          </button>
        </div>
      </form>
    </div>
  );
};

export default Registro;
