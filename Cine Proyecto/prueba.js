const express = require('express');
const bodyParser = require('body-parser');
const oracledb = require('oracledb'); 
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'css/agregar.css')));

const dbConfig = {
    user: 'Cinema',
    password: '123',
    connectString: '//localhost:1521/orcl.lan' 
};


app.get('/agregar-pelicula', (req, res) => {
    const filePath = path.join(__dirname, '/agregarPeliculas.html');
    res.sendFile(filePath);
});

app.post('/agregar-pelicula', (req, res) => {
    const { nombre, director, genero,fecha_estreno,clasificacion} = req.body;


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

app.listen(port, () => {
    console.log(`El servidor Express está funcionando en http://localhost:${port}`);
});