const axios = require('axios');
const { botToken } = require('./config');

// Базовый URL для Telegram Bot API
const API_URL = `https://api.telegram.org/bot${botToken}`;

/**
 * Отправка сообщения пользователю Telegram
 * @param {number|string} chatId - ID чата/пользователя
 * @param {string} text - Текст сообщения
 * @param {Object} options - Дополнительные параметры
 * @returns {Promise<Object>} - Ответ от Telegram API
 */
async function sendMessage(chatId, text, options = {}) {
  try {
    const response = await axios.post(`${API_URL}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error.message);
    throw error;
  }
}

/**
 * Отправка уведомления о записи на процедуру
 * @param {number|string} chatId - ID чата/пользователя
 * @param {Object} appointment - Данные о записи
 * @returns {Promise<Object>} - Ответ от Telegram API
 */
async function sendAppointmentNotification(chatId, appointment) {
  const { service, date, time } = appointment;
  const formattedDate = new Date(date).toLocaleDateString('ru-RU');
  
  const message = `
<b>Новая запись на процедуру!</b>

Уважаемый клиент, вы успешно записаны на процедуру:

🔹 Услуга: <b>${service}</b>
📅 Дата: <b>${formattedDate}</b>
🕒 Время: <b>${time}</b>

Для отмены или переноса записи, пожалуйста, свяжитесь с администратором.
  `;
  
  return sendMessage(chatId, message);
}

/**
 * Отправка уведомления о новом заказе
 * @param {number|string} chatId - ID чата/пользователя
 * @param {Object} order - Данные о заказе
 * @returns {Promise<Object>} - Ответ от Telegram API
 */
async function sendOrderNotification(chatId, order) {
  const { orderId, total, products } = order;
  
  let productsText = products.map(p => `• ${p.name} - ${p.price} руб. x ${p.quantity} шт.`).join('\n');
  
  const message = `
<b>Новый заказ #${orderId}</b>

Уважаемый клиент, ваш заказ успешно оформлен:

<b>Товары:</b>
${productsText}

<b>Итого:</b> ${total} руб.

Наш менеджер свяжется с вами для уточнения деталей доставки.
  `;
  
  return sendMessage(chatId, message);
}

/**
 * Отправка напоминания о предстоящей процедуре
 * @param {number|string} chatId - ID чата/пользователя
 * @param {Object} appointment - Данные о записи
 * @returns {Promise<Object>} - Ответ от Telegram API
 */
async function sendReminderNotification(chatId, appointment) {
  const { service, date, time } = appointment;
  const formattedDate = new Date(date).toLocaleDateString('ru-RU');
  
  const message = `
<b>Напоминание о записи</b>

Уважаемый клиент, напоминаем о предстоящей процедуре:

🔹 Услуга: <b>${service}</b>
📅 Дата: <b>${formattedDate}</b>
🕒 Время: <b>${time}</b>

Ждем вас по адресу: [адрес салона]
  `;
  
  return sendMessage(chatId, message);
}

/**
 * Отправка фото в чат
 * @param {number|string} chatId - ID чата/пользователя
 * @param {string} photoUrl - URL фото или file_id
 * @param {string} caption - Подпись к фото
 * @returns {Promise<Object>} - Ответ от Telegram API
 */
async function sendPhoto(chatId, photoUrl, caption = '') {
  try {
    const response = await axios.post(`${API_URL}/sendPhoto`, {
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: 'HTML'
    });
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при отправке фото:', error.message);
    throw error;
  }
}

/**
 * Проверка валидности webhook-данных от Telegram
 * @param {string} initData - Данные инициализации от Telegram WebApp
 * @returns {boolean} - Результат проверки
 */
function validateWebAppData(initData) {
  // В реальном приложении здесь должна быть реализация проверки
  // согласно документации Telegram: https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
  
  // Заглушка для тестирования
  console.log('Проверка данных веб-приложения:', initData);
  return true;
}

module.exports = {
  sendMessage,
  sendAppointmentNotification,
  sendOrderNotification,
  sendReminderNotification,
  sendPhoto,
  validateWebAppData
}; 