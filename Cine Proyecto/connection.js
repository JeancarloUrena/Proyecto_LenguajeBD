const oracledb = require('oracledb');

// Configura los datos de conexión
const dbConfig = {
user: 'Cinema',
password: '123',
connectString: '//localhost:1521/orcl.lan'
};

// Exporta la función para establecer la conexión
async function createConnection() {
let connection;
try {
    connection = await oracledb.getConnection(dbConfig);
    console.log('Conexión exitosa a Oracle Database');
    return connection;
} catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw error;
}
}

module.exports = createConnection;