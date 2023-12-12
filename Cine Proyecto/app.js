const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const oracledb = require('oracledb');
const app = express();
const port = 3000;
const cors = require('cors');
const multer = require('multer');




const dbConfig = {
    user: 'Cinema',
    password: '123',
    connectString: '//localhost:1521/orcl.lan',
    poolMin: 2,
    poolMax: 10,
    poolIncrement: 2,
};
oracledb.createPool(dbConfig, (err, pool) => {
    if (err) {
        console.error('Error al crear el pool de conexiones:', err);
        return;
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


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

app.post('/agregar-pelicula', upload.single('imagen'), async (req, res) => {
    const { nombre, director, genero, fecha_estreno, clasificacion } = req.body;
    const imagen = req.file.buffer;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        await connection.execute(
            `BEGIN InsertarPelicula(:nombre, :director, :genero, :fecha_estreno, :clasificacion, :imagen); END;`,
            {
                nombre: nombre,
                director: director,
                genero: genero,
                fecha_estreno: new Date(fecha_estreno),
                clasificacion: clasificacion,
                imagen: imagen
            },
            { autoCommit: true }
        );

        console.log('Datos y imagen agregados a la base de datos.');
        res.send('Datos agregados exitosamente.');
    } catch (error) {
        console.error('Error al agregar datos a la base de datos:', error);
        res.status(500).send('Error al agregar datos a la base de datos.');
    }
});
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

app.get('/actualizarCliente', (req, res) => {
    res.sendFile(__dirname + '/actualizarcliente.html');
});

// Ruta para manejar la actualización del cliente
app.post('/actualizarCliente', async (req, res) => {
    const { numeroCedula, nombre, apellido1, apellido2, email, contrasena } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado para actualizar el cliente
        const result = await connection.execute(
            `BEGIN
                ACTUALIZAR_CLIENTE(:numeroCedula, :nombre, :apellido1, :apellido2, :email, :contrasena);
            END;`,
            { numeroCedula, nombre, apellido1, apellido2, email, contrasena }
        );

        await connection.commit(); // Commit explícito después de la actualización
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar el cliente.' });
    }
});

app.get('/eliminarCliente', (req, res) => {
    res.sendFile(__dirname + '/eliminar.html');
});
// Procedimiento de Eliminación
app.post('/eliminarCliente', async (req, res) => {
    const { numeroCedula } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);
        const result = await connection.execute(
            `BEGIN
            ELIMINAR_CLIENTE(:numero_Cedula);
            END;`,
            { numeroCedula }
        );

        await connection.close();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar el cliente.' });
    }
});

app.get('/actualizarPelicula', (req, res) => {
    res.sendFile(__dirname + '/actualizarpelicula.html');
});

// Ruta para manejar la actualización del cliente
app.post('/actualizarPelicula', async (req, res) => {
    const { id_Pelicula, nombre, director, genero, fechaEstreno, clasificacion } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado para actualizar la película
        const result = await connection.execute(
            `BEGIN
            ACTUALIZAR_PELICULA(:P_ID_PELICULA, :P_NOMBRE, :P_DIRECTOR, :P_GENERO, TO_DATE(:P_FECHA_ESTRENO, 'YYYY-MM-DD'), :P_CLASIFICACION);
            END;`,
            {
                P_ID_PELICULA: id_Pelicula,
                P_NOMBRE: nombre,
                P_DIRECTOR: director,
                P_GENERO: genero,
                P_FECHA_ESTRENO: fechaEstreno,
                P_CLASIFICACION: clasificacion
            }
        );

        await connection.commit(); // Commit explícito después de la actualización
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar la película.' });
    }
});

app.get('/eliminarPelicula', (req, res) => {
    res.sendFile(__dirname + '/eliminarpelicula.html');
});

app.post('/eliminarPelicula', async (req, res) => {
    const { id_Pelicula } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN
                ELIMINAR_PELICULA(:P_ID_PELICULA);
            END;`,
            {
                P_ID_PELICULA: id_Pelicula
            }
        );

        await connection.commit();
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar la película.' });
    }
});

app.get('/salashorarios', async (req, res) => {
    let connection;

    try {
        connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(`
            SELECT
                S.NUMERO_SALA,
                S.TIPO_PANTALLA,
                H.FECHA_HORA
            FROM
                SALAS S
                JOIN HORARIOS H ON S.ID_SALA = H.ID_SALA
        `);

        // Verifica si hay resultados
        if (result.rows.length === 0) {
            res.status(404).send('No hay información disponible de salas y horarios.');
            return;
        }

        const salasYHorarios = result.rows.map(row => ({
            NUMERO_SALA: row[0],
            TIPO_PANTALLA: row[1],
            FECHA_HORA: row[2]
        }));

        res.json(salasYHorarios);
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

const comentarios = [];

app.get('/comentarios', (req, res) => {
    try {
        res.json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor al obtener comentarios.' });
    }
});

app.post('/comentarios', (req, res) => {
    const nuevoComentario = req.body.comentario;

    if (!nuevoComentario || nuevoComentario.trim() === '') {
        res.status(400).json({ error: 'Por favor, escribe un comentario válido.' });
        return;
    }

    comentarios.push(nuevoComentario);
    res.json({ mensaje: 'Comentario agregado con éxito' });
});

app.get('/agregar-inventario', (req, res) => {
    res.sendFile(__dirname + '/agregarinventario.html');
});

// Ruta para procesar el formulario
app.post('/agregar-inventario', async (req, res) => {
    const { producto, cantidad, precio } = req.body;

    try {
        // Establecer la conexión a la base de datos
        const connection = await oracledb.getConnection(dbConfig);

        // Definir un objeto de tipo oracledb.OutFormat para manejar los parámetros de salida
        const outFormat = {
            id_inventario: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        };

        // Ejecutar el procedimiento almacenado
        const result = await connection.execute(
            `BEGIN INSERTAR_INVENTARIO(:id_inventario, :producto, :cantidad, :precio); END;`,
            {
                id_inventario: outFormat.id_inventario,
                producto,
                cantidad,
                precio,
            },
            { autoCommit: true }
        );

        console.log('ID del inventario agregado:', result.outBinds.id_inventario);

        res.send('Inventario agregado correctamente');
    } catch (error) {
        console.error('Error al agregar inventario:', error);
        res.status(500).send('Error interno del servidor');
    }
});

app.get('/actualizarInventario', (req, res) => {
    res.sendFile(__dirname + '/actualizarinventario.html');
});

// Ruta para manejar la actualización del cliente
app.post('/actualizarInventario', async (req, res) => {
    const { id_Inventario, producto, cantidad, precio, id_horario} = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado para actualizar la película
        const result = await connection.execute(
            `BEGIN
            ACTUALIZAR_INVENTARIO(:P_ID_INVENTARIO, :P_PRODUCTO, :P_CANTIDAD, :P_PRECIO, :P_ID_HORARIO);
            END;`,
            {
                P_ID_INVENTARIO: id_Inventario,
                P_PRODUCTO: producto,
                P_CANTIDAD: cantidad,
                P_PRECIO: precio,
                P_ID_HORARIO: id_horario
            }
        );

        await connection.commit(); // Commit explícito después de la actualización
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar la película.' });
    }
});




app.get('/eliminarInventario', (req, res) => {
    res.sendFile(__dirname + '/eliminarinventario.html');
});

app.post('/eliminarInventario', async (req, res) => {
    const { id_Pelicula } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN
                ELIMINAR_INVENTARIO(:P_ID_INVENTARIO);
            END;`,
            {
                P_ID_PELICULA: id_inventario
            }
        );

        await connection.commit();
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar la película.' });
    }
});

app.get('/agregar-empleado', (req, res) => {
    const filePath = path.join(__dirname, 'agregarEmpleado.html');
    res.sendFile(filePath);
});


app.post('/agregar-empleado', async (req, res) => {
    const {
        numero_cedula,
        nombre,
        apellido1,
        apellido2,
        email,
        direccion,
        salario,
        id_puesto
    } = req.body;

    try {
        // Establecer la conexión a la base de datos
        const connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado
        await connection.execute(
            `BEGIN INSERTAR_EMPLEADO(:numero_cedula, :nombre, :apellido1, :apellido2, :email, :direccion, :salario, :id_puesto); END;`,
            {
                numero_cedula,
                nombre,
                apellido1,
                apellido2,
                email,
                direccion,
                salario,
                id_puesto
            },
            { autoCommit: true }
        );

        // Redirigir o enviar alguna respuesta
        res.send('Empleado agregado correctamente');
    } catch (error) {
        console.error('Error al agregar empleado:', error);
        res.status(500).send('Error interno del servidor');
    }
});



app.get('/actualizar-empleado', (req, res) => {
    res.sendFile(__dirname + '/actualizarempleado.html');
});

// Ruta para manejar la actualización del cliente
app.post('/actualizar-empleado', async (req, res) => {
    const { Numero_Cedula, nombre, apellido1, apellido2, email, direccion,salario, id_puesto } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        // Ejecutar el procedimiento almacenado para actualizar la película
        const result = await connection.execute(
            `BEGIN
            ACTUALIZAR_EMPLEADO(:P_CEDULA, :P_NOMBRE, :P_APELLIDO1, :P_APELLIDO2, :P_EMAIL, :P_DIRECCION, :P_SALARIO, :P_ID_PUESTO);
            END;`,
            {
                P_CEDULA: Numero_Cedula,
                P_NOMBRE: nombre,
                P_APELLIDO1: apellido1,
                P_APELLIDO2: apellido2,
                P_EMAIL: email,
                P_DIRECCION: direccion,
                P_SALARIO: salario,
                P_ID_PUESTO: id_puesto
            }
        );

        await connection.commit(); // Commit explícito después de la actualización
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al actualizar la película.' });
    }
});


app.get('/eliminarEmpleado', (req, res) => {
    res.sendFile(__dirname + '/eliminarempleado.html');
});

app.post('/eliminarEmpleado', async (req, res) => {
    const { id_Pelicula } = req.body;

    try {
        const connection = await oracledb.getConnection(dbConfig);

        const result = await connection.execute(
            `BEGIN
                ELIMINAR_EMPLEADO(:P_CEDULA);
            END;`,
            {
                P_CEDULA: Numero_Cedula
            }
        );

        await connection.commit();
        await connection.close();

        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error al eliminar la película.' });
    }
});


app.listen(port, () => {
    console.log(`El servidor Express está funcionando en http://localhost:${port}`);
});