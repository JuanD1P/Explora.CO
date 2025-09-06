
import mysql from 'mysql';


const con = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'exploraCO',
  connectionLimit: 10,
  timezone: 'Z',   
  dateStrings: true,  
});


con.getConnection((err, connection) => {
  if (err) {
    console.log('❌ Conexión errónea:', err);
  } else {
    console.log('✅ Conexión exitosa a la base de datos');
    connection.release();
  }
});

export default con;
