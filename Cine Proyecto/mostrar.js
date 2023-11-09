
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'css/styles.css')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'inicio.html')); 
});

app.listen(port, () => {
    console.log(`El servidor Express está funcionando en http://localhost:${port}`);
});




