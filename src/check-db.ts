import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const client = await pool.connect();
  try {
    console.log("Checking tables in database...");
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Tables found:", tablesRes.rows.map(r => r.table_name));

    // Check columns of usuario
    const usuarioCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuario' AND table_schema = 'public';
    `);
    console.log("Usuario columns:", usuarioCols.rows);

    // Check columns of rol
    const rolCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rol' AND table_schema = 'public';
    `);
    console.log("Rol columns:", rolCols.rows);

    // Check if usuario_rol exists
    const hasUsuarioRol = tablesRes.rows.some(r => r.table_name === 'usuario_rol');
    if (hasUsuarioRol) {
      const usuarioRolCols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'usuario_rol' AND table_schema = 'public';
      `);
      console.log("Usuario_rol columns:", usuarioRolCols.rows);
    }

    // List roles in the DB
    const rolesRes = await client.query("SELECT * FROM rol;");
    console.log("Roles in DB:", rolesRes.rows);

    // Check if there are users in DB
    const usersRes = await client.query("SELECT id, nombre, email FROM usuario;");
    console.log("Users in DB:", usersRes.rows);

  } catch (err) {
    console.error("Error checking db:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

check();
