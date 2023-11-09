const oracledb = require('oracledb');
const dbConfig = {
  user: 'tu_usuario',
  password: 'tu_contraseña',
  connectString: 'localhost:1521/TuSID' // Cambia esto según tu configuración
};

oracledb.getConnection(dbConfig, async (err, connection) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }

  // Crear una nueva película
  const createMovie = async () => {
    try {
      const sql = `INSERT INTO PELICULAS (ID_PELICULA, NOMBRE, DIRECTOR, GENERO, FECHA_ESTRENO, CLASIFICACION)
                   VALUES (:id, :nombre, :director, :genero, :fechaEstreno, :clasificacion)`;
      const bindParams = {
        id: 1,
        nombre: 'Ejemplo de Película',
        director: 'Director de Prueba',
        genero: 'Acción',
        fechaEstreno: new Date('2023-11-07'),
        clasificacion: 'PG-13'
      };

      const result = await connection.execute(sql, bindParams, { autoCommit: true });
      console.log('Película creada con éxito');
    } catch (err) {
      console.error('Error al crear película:', err);
    }
  };

  // Leer películas
  const readMovies = async () => {
    try {
      const result = await connection.execute('SELECT * FROM PELICULAS');
      console.log('Películas:');
      for (const row of result.rows) {
        console.log(row);
      }
    } catch (err) {
      console.error('Error al leer películas:', err);
    }
  };

  // Actualizar una película
  const updateMovie = async () => {
    try {
      const sql = `UPDATE PELICULAS
                   SET NOMBRE = :nombre, DIRECTOR = :director
                   WHERE ID_PELICULA = :id`;
      const bindParams = {
        id: 1,
        nombre: 'Nuevo Nombre de Película',
        director: 'Nuevo Director'
      };

      const result = await connection.execute(sql, bindParams, { autoCommit: true });
      console.log('Película actualizada con éxito');
    } catch (err) {
      console.error('Error al actualizar película:', err);
    }
  };

  // Eliminar una película
  const deleteMovie = async () => {
    try {
      const sql = 'DELETE FROM PELICULAS WHERE ID_PELICULA = :id';
      const bindParams = {
        id: 1
      };

      const result = await connection.execute(sql, bindParams, { autoCommit: true });
      console.log('Película eliminada con éxito');
    } catch (err) {
      console.error('Error al eliminar película:', err);
    }
  };

  // Ejecutar las operaciones
  createMovie();
  readMovies();
  updateMovie();
  deleteMovie();

  connection.close();
});