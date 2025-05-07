const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Импортируем основные настройки
const config = {
  port: process.env.PORT || 4000,
  botToken: process.env.BOT_TOKEN || '1000694411:AAFmKBRCY8jQZS4sDD4w7Sa_2j3Vi_HDv5E',
  isDev: process.env.NODE_ENV !== 'production',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cosmetics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'suxxxx666'
  }
};

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

// Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT} в ${process.env.NODE_ENV || 'development'} режиме`);
  console.log(`URL приложения: ${process.env.RENDER_EXTERNAL_URL || 'http://localhost:' + PORT}`);
  
  // Инициализируем базу данных
  db.init().then(() => {
    console.log('База данных успешно инициализирована');
  }).catch(err => {
    console.error('Ошибка при инициализации базы данных:', err);
  });
}); 