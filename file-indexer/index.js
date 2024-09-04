const express = require('express');
const app = express();
const port = 3000;

// Import routes
const deviceInfoRoute = require('./routes/deviceInfo');
const filesRoute = require('./routes/files');
const clearTempFolder = require('./routes/clearTemp');

// Bersihkan folder temp saat server dimulai
clearTempFolder();

// Setup static files serving
app.use(express.static('public'));

// Gunakan rute yang diimport
app.use('/device-info', deviceInfoRoute);
app.use('/files', filesRoute);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
