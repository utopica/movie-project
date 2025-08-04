const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const auth = require('./lib/auth')(); 

app.use(cors());
app.use(express.json());

app.use(express.static(path.resolve(__dirname, '../../frontend')));

app.use(auth.initialize());

app.use('/api', require('./routes/index'));

const fs = require('fs');
const frontendPath = path.resolve(__dirname, '../../frontend');
const htmlFiles = fs.readdirSync(frontendPath).filter(file => file.endsWith('.html'));

app.get('/movies-list', (req, res) => {
  res.sendFile(path.join(frontendPath, 'movies-list'));
});

app.get('/series-list', (req, res) => {
  res.sendFile(path.join(frontendPath, 'series-list.html'));
});

app.get('/genres', (req, res) => {
  res.sendFile(path.join(frontendPath, 'genres.html'));
});

app.get('/genres_details', (req, res) => {
  res.sendFile(path.join(frontendPath, 'genres_details.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/series/:id', (req, res) => {
  res.sendFile(path.join(frontendPath, 'series.html'));
});

app.get('/movies/:id', (req, res) => {
  res.sendFile(path.join(frontendPath, 'movies.html'));
});

// Remove the app.listen from here since it's in server.js
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

module.exports = app;