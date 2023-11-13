const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const oracledb = require('oracledb');
const app = express();
const port = 3000;
const cors = require('cors');


const dbConfig = {
    user: 'Cinema',
    password: '123',
    connectString: '//localhost:1521/orcl.lan'
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'css')));
app.use(express.static(__dirname));
app.use(cors());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'inicio.html'));
});

// Carga la página de agregar películas para '/agregar-pelicula'
app.get('/agregar-pelicula', (req, res) => {
    const filePath = path.join(__dirname, 'agregarPeliculas.html');
    res.sendFile(filePath);
});

app.post('/agregar-pelicula', (req, res) => {
    const { nombre, director, genero, fecha_estreno, clasificacion } = req.body;


    oracledb.getConnection(dbConfig, (error, connection) => {
        if (error) {
            console.error('Error al conectar a la base de datos Oracle:', error);
            res.status(500).send('Error al conectar a la base de datos.');
            return;
        }


        connection.execute(
            `INSERT INTO PELICULAS (nombre, director, genero, fecha_estreno, clasificacion) VALUES (:nombre, :director, :genero, TO_DATE(:fechaEstreno, 'YYYY-MM-DD'), :clasificacion)`,
            [nombre, director, genero, fecha_estreno, clasificacion],
            (err, result) => {
                if (err) {
                    console.error('Error al agregar datos a la base de datos:', err);
                    res.status(500).send('Error al agregar datos a la base de datos.');
                } else {
                    console.log('Datos agregados a la base de datos.');
                    // Realiza un commit después de la inserción
                    connection.execute('COMMIT', (commitError) => {
                        if (commitError) {
                            console.error('Error al realizar commit:', commitError);
                            res.status(500).send('Error al realizar commit.');
                        } else {
                            console.log('Commit realizado con éxito.');
                            res.send('Datos agregados exitosamente.');
                        }

                        connection.close((cerrarError) => {
                            if (cerrarError) {
                                console.error('Error al cerrar la conexión:', cerrarError);
                            }
                        });
                    });
                }
            }
        );
    });
});
// Registrarse 
app.get('/agregar-cliente', (req, res) => {
    const filePath = path.join(__dirname, 'agregarClientes.html');
    res.sendFile(filePath);
});

app.post('/agregar-cliente', (req, res) => {
    const { cedula, nombre, apellido1, apellido2, email, password } = req.body;


    oracledb.getConnection(dbConfig, (error, connection) => {
        if (error) {
            console.error('Error al conectar a la base de datos Oracle:', error);
            res.status(500).send('Error al conectar a la base de datos.');
            return;
        }


        connection.execute(
            `INSERT INTO CLIENTES (numero_cedula, nombre, apellido1, apellido2, email,contrasena) VALUES (:numero_cedula, :nombre, :apellido1, :apellido2, :email, :contrasena)`,
            [cedula, nombre, apellido1, apellido2, email, password],
            (err, result) => {
                if (err) {
                    console.error('Error al agregar datos a la base de datos:', err);
                    res.status(500).send('Error al agregar datos a la base de datos.');
                } else {
                    console.log('Datos agregados a la base de datos.');
                    // Realiza un commit después de la inserción
                    connection.execute('COMMIT', (commitError) => {
                        if (commitError) {
                            console.error('Error al realizar commit:', commitError);
                            res.status(500).send('Error al realizar commit.');
                        } else {
                            console.log('Commit realizado con éxito.');
                            res.send('Datos agregados exitosamente.');
                        }

                        connection.close((cerrarError) => {
                            if (cerrarError) {
                                console.error('Error al cerrar la conexión:', cerrarError);
                            }
                        });
                    });
                }
            }
        );
    });
});
// login
app.get('/login', (req, res) => {
    const filePath = path.join(__dirname, 'login.html');
    res.sendFile(filePath);
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `SELECT * FROM CLIENTES WHERE EMAIL = :email AND CONTRASENA= :contrasena`,
            [username, password],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length > 0) {
            res.redirect('/');
        } else {
            res.status(401).send('Credenciales incorrectas. Inténtalo de nuevo.');
        }

        await connection.close();
    } catch (error) {
        console.error('Error de base de datos:', error);
        res.status(500).send('Error interno del servidor.');
    }
});

app.get('/peliculas', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute('SELECT * FROM PELICULAS');

        // Verifica si hay resultados
        if (result.rows.length === 0) {
            res.status(404).send('No hay películas disponibles.');
            return;
        }

        // Transforma el resultado de la base de datos en un formato más amigable
        const peliculas = result.rows.map(row => ({
            ID_PELICULA: row[0],
            NOMBRE: row[1],
            DIRECTOR: row[2],
            GENERO: row[3],
            FECHA_ESTRENO: row[4],
            CLASIFICACION: row[5]
        }));

        res.json(peliculas);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error al obtener datos de la base de datos.');
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err.message);
            }
        }
    }
});


app.listen(port, () => {
    console.log(`El servidor Express está funcionando en http://localhost:${port}`);
});