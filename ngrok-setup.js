/**
 * Скрипт для автоматического запуска ngrok туннеля
 * Позволяет получить временный HTTPS URL для тестирования вашего Telegram Mini App
 * 
 * Установите ngrok: npm install ngrok
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const ngrok = require('ngrok');
const { port, isDev, botToken } = require('./config');

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

// Запускаем сервер
const server = app.listen(port, async () => {
  console.log(`Локальный сервер запущен на порту ${port} в ${isDev ? 'режиме разработки' : 'production режиме'}`);
  
  try {
    // Запускаем ngrok для создания туннеля к локальному серверу
    const url = await ngrok.connect({
      addr: port,
      proto: 'http'
    });
    
    console.log(`\n=============================================`);
    console.log(`🔗 Ваш ngrok URL: ${url}`);
    console.log(`=============================================`);
    console.log(`\n1. Перейдите в Telegram и найдите @BotFather`);
    console.log(`2. Отправьте команду /mybots и выберите своего бота`);
    console.log(`3. Выберите "Bot Settings" -> "Menu Button"`);
    console.log(`4. Нажмите "Configure menu button"`);
    console.log(`5. Вставьте URL: ${url}`);
    console.log(`6. Введите текст для кнопки меню, например "Салон красоты"`);
    console.log(`7. Откройте вашего бота и нажмите на кнопку меню для тестирования\n`);
    
    // Бонус: если хотите автоматически настроить меню бота через Telegram API
    // Раскомментируйте этот код и замените BOT_MENU_TEXT на нужный текст для кнопки
    /*
    const axios = require('axios');
    const BOT_MENU_TEXT = 'Салон красоты';
    
    try {
      const response = await axios.post(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
        menu_button: {
          type: 'web_app',
          text: BOT_MENU_TEXT,
          web_app: {
            url: url
          }
        }
      });
      
      if (response.data.ok) {
        console.log('🎉 Кнопка меню бота успешно настроена автоматически!');
      } else {
        console.log('❌ Не удалось автоматически настроить кнопку меню бота.');
      }
    } catch (error) {
      console.error('Ошибка при настройке кнопки меню бота:', error.message);
    }
    */
    
  } catch (error) {
    console.error('Ошибка при запуске ngrok:', error);
    console.log('Убедитесь, что вы установили ngrok: npm install ngrok');
  }
});

// Корректно завершаем работу при остановке скрипта
process.on('SIGINT', async () => {
  console.log('Завершение работы...');
  await ngrok.kill();
  server.close();
  process.exit(0);
}); 