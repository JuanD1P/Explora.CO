import express from 'express';
import con from '../utils/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios'; 

const router = express.Router();

// 🚀 REGISTRO DE USUARIOS
router.post('/register', async (req, res) => {
  const { email, password, nombre_completo } = req.body;
  const rol = (req.body.rol || 'USER').toUpperCase();
  const telefono = req.body.telefono || null;

  if (!email || !password || !nombre_completo) {
    return res.json({ registrationStatus: false, Error: "Faltan datos" });
  }
  if (!['USER','EMPRESA'].includes(rol)) {
    return res.json({ registrationStatus: false, Error: "Rol inválido" });
  }
  if (rol === 'EMPRESA' && !telefono) {
    return res.json({ registrationStatus: false, Error: "El teléfono es obligatorio para EMPRESA" });
  }

  con.query("SELECT id FROM usuarios WHERE email = ?", [email], async (err, result) => {
    if (err) return res.json({ registrationStatus: false, Error: "Error en la base de datos" });
    if (result.length > 0) return res.json({ registrationStatus: false, Error: "El email ya está registrado" });

    try {
      const hashed = await bcrypt.hash(password, 10);
      const sql = `INSERT INTO usuarios (email, password, nombre_completo, rol, telefono)
                   VALUES (?, ?, ?, ?, ?)`;
      con.query(sql, [email, hashed, nombre_completo, rol, telefono], (err2) => {
        if (err2) return res.json({ registrationStatus: false, Error: "Error de inserción" });
        return res.json({ registrationStatus: true });
      });
    } catch {
      return res.status(500).json({ registrationStatus: false, Error: "Error interno" });
    }
  });
});


// 🚀 LOGIN DE USUARIOS
router.post('/userlogin', (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";

  con.query(sql, [email], async (err, result) => {
    if (err) return res.json({ loginStatus: false, Error: "Error en la base de datos" });
    if (result.length === 0) return res.json({ loginStatus: false, Error: "Usuario no encontrado" });

    try {
      const user = result[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.json({ loginStatus: false, Error: "Contraseña incorrecta" });

      // Incluye el id en el token (opcional pero recomendado)
      const token = jwt.sign(
        { id: user.id, role: user.rol, email: user.email },
        "jwt_secret_key",
        { expiresIn: '1d' }
      );

      res.cookie('token', token, { httpOnly: true });

      // ⬇️ ¡Enviamos también el id explícitamente!
      return res.json({
        loginStatus: true,
        role: user.rol,
        token,
        id: user.id,               // <-- clave
        nombre: user.nombre_completo
      });
    } catch (error) {
      return res.json({ loginStatus: false, Error: "Error interno" });
    }
  });
});


// 🧾 OBTENER TODOS LOS USUARIOS
router.get('/usuarios', (req, res) => {
    con.query("SELECT id, nombre_completo, email, rol FROM usuarios", (err, result) => {
        if (err) {
            console.error("Error al obtener usuarios:", err);
            return res.status(500).json({ error: "Error al obtener usuarios" });
        }
        res.json(result);
    });
});

// 🛠️ ACTUALIZAR ROL DE USUARIO
router.put('/usuarios/:id/rol', (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['USER', 'ADMIN', 'EMPRESA'].includes(rol)) {
  return res.status(400).json({ error: "Rol inválido" });
}

    con.query("UPDATE usuarios SET rol = ? WHERE id = ?", [rol, id], (err, result) => {
        if (err) {
            console.error("Error al actualizar rol:", err);
            return res.status(500).json({ error: "Error al actualizar el rol" });
        }
        res.json({ message: "Rol actualizado correctamente" });
    });
});


// 🗑️ ELIMINAR USUARIO POR ID
router.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;

    con.query("DELETE FROM usuarios WHERE id = ?", [id], (err, result) => {
        if (err) {
            console.error("❌ Error al eliminar usuario:", err);
            return res.status(500).json({ error: "Error al eliminar el usuario" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        res.json({ message: "Usuario eliminado correctamente" });
    });
});
export const userRouter = router;

// 🧾 OBTENER TODOS LOS USUARIOS
router.get('/usuarios', (req, res) => {
    con.query("SELECT id, nombre_completo, email, rol FROM usuarios", (err, result) => {
        if (err) {
            console.error("Error al obtener usuarios:", err);
            return res.status(500).json({ error: "Error al obtener usuarios" });
        }
        res.json(result);
    });
});

// 🛠️ ACTUALIZAR ROL DE USUARIO
router.put('/usuarios/:id/rol', (req, res) => {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['USER', 'ADMIN'].includes(rol)) {
        return res.status(400).json({ error: "Rol inválido" });
    }

    con.query("UPDATE usuarios SET rol = ? WHERE id = ?", [rol, id], (err, result) => {
        if (err) {
            console.error("Error al actualizar rol:", err);
            return res.status(500).json({ error: "Error al actualizar el rol" });
        }
        res.json({ message: "Rol actualizado correctamente" });
    });
});


// 🧾 OBTENER TODOS LOS USUARIOS
router.get('/usuarios', (req, res) => {
    con.query("SELECT id, nombre_completo, email, rol FROM usuarios", (err, result) => {
        if (err) {
            console.error("Error al obtener usuarios:", err);
            return res.status(500).json({ error: "Error al obtener usuarios" });
        }
        res.json(result);
    });
});




