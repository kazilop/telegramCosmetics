require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  botToken: process.env.BOT_TOKEN || 'your_telegram_bot_token',
  isDev: process.env.NODE_ENV !== 'production',
  
  // Настройки базы данных PostgreSQL
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'cosmetics',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'suxxxx666'
  }
}; 