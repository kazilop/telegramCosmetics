const express = require('express');
const cors = require('cors');
const path = require('path');
const { port, isDev } = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Маршруты API
app.use('/api', require('./routes/api'));

// Обработка всех других запросов для SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port} в ${isDev ? 'режиме разработки' : 'production режиме'}`);
}); 