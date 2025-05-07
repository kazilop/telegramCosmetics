const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { port, isDev } = require('./config');

// Инициализируем базу данных
const db = require('./db');

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

// Настройки HTTPS
try {
  // Для реальной работы, замените пути на пути к вашим сертификатам
  const privateKey = fs.readFileSync('ssl/private.key', 'utf8');
  const certificate = fs.readFileSync('ssl/certificate.crt', 'utf8');

  const credentials = { key: privateKey, cert: certificate };
  
  // Создаем HTTPS сервер
  const httpsServer = https.createServer(credentials, app);
  
  httpsServer.listen(port, () => {
    console.log(`HTTPS сервер запущен на порту ${port} в ${isDev ? 'режиме разработки' : 'production режиме'}`);
  });
} catch (error) {
  console.error('Ошибка при запуске HTTPS сервера:', error);
  console.log('Запускаем обычный HTTP сервер для тестирования...');
  
  // Если не удалось запустить HTTPS, запускаем обычный HTTP сервер
  app.listen(port, () => {
    console.log(`HTTP сервер запущен на порту ${port} в ${isDev ? 'режиме разработки' : 'production режиме'}`);
  });
} 