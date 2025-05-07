const express = require('express');
const router = express.Router();
const { validateWebAppData } = require('../bot');
const db = require('../db');

// Модель данных (заглушка)
const appointments = [];
const customers = {};
const products = [
  { id: 1, name: 'Крем для лица', price: 1200, category: 'Уход за лицом', image: '/images/face-cream.jpg', description: 'Увлажняющий крем для лица с гиалуроновой кислотой' },
  { id: 2, name: 'Сыворотка для волос', price: 950, category: 'Уход за волосами', image: '/images/hair-serum.jpg', description: 'Восстанавливающая сыворотка для поврежденных волос' },
  { id: 3, name: 'Гель для умывания', price: 750, category: 'Уход за лицом', image: '/images/face-wash.jpg', description: 'Очищающий гель для всех типов кожи' },
  { id: 4, name: 'Маска для лица', price: 850, category: 'Уход за лицом', image: '/images/face-mask.jpg', description: 'Питательная маска для сияния кожи' }
];
const faqs = [
  { id: 1, question: 'Как часто нужно делать процедуру?', answer: 'Рекомендуемая частота зависит от типа процедуры. Обычно 1 раз в 2-4 недели.' },
  { id: 2, question: 'Сколько длится эффект?', answer: 'Эффект от процедуры обычно длится 3-6 месяцев в зависимости от индивидуальных особенностей.' },
  { id: 3, question: 'Есть ли противопоказания?', answer: 'Да, у большинства процедур есть противопоказания. Проконсультируйтесь со специалистом перед записью.' },
  { id: 4, question: 'Что делать перед процедурой?', answer: 'Перед процедурой рекомендуется избегать загара, алкоголя и воздействия на кожу агрессивных средств.' },
  { id: 5, question: 'Что делать после процедуры?', answer: 'После процедуры следуйте индивидуальным рекомендациям специалиста, обычно это увлажнение кожи и защита от солнца.' }
];

// Подготовка и рекомендации
const preparations = {
  'facial': 'Перед уходом за лицом не рекомендуется использовать скрабы и агрессивные очищающие средства за 3 дня до процедуры. Избегайте загара.',
  'massage': 'Перед массажем рекомендуется не есть за 1.5-2 часа до процедуры. Примите душ непосредственно перед визитом.',
  'laser': 'Перед лазерной эпиляцией нельзя загорать 2 недели, нельзя выщипывать или использовать воск. Можно только брить за 1-2 дня до процедуры.',
  'manicure': 'Перед маникюром не рекомендуется использовать средства с маслами для рук. Снимите предыдущее покрытие.'
};

const aftercare = {
  'facial': 'После ухода за лицом не рекомендуется использовать макияж 24 часа, загорать 5-7 дней. Используйте рекомендованные средства для домашнего ухода.',
  'massage': 'После массажа рекомендуется пить больше воды и избегать физических нагрузок в день процедуры.',
  'laser': 'После лазерной эпиляции нельзя загорать 2 недели, посещать сауну/бассейн, использовать скрабы. Обязательно используйте солнцезащитный крем.',
  'manicure': 'После маникюра не контактируйте с агрессивными химическими веществами без перчаток, используйте масло для кутикулы ежедневно.'
};

const intervals = {
  'facial': '2-4 недели в зависимости от типа кожи и проблем',
  'massage': '1-2 раза в неделю для курса или 1 раз в 2 недели для поддержания',
  'laser': '4-8 недель в зависимости от зоны и индивидуальных особенностей',
  'manicure': '2-3 недели в зависимости от скорости роста ногтей и типа покрытия'
};

// Аутентификация пользователя Телеграм
router.post('/auth', async (req, res) => {
  try {
    const { initData } = req.body;
    
    if (!initData) {
      return res.status(400).json({ success: false, message: 'Отсутствуют данные инициализации' });
    }
    
    // В реальном приложении здесь должна быть проверка данных
    const isValid = validateWebAppData(initData);
    
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Недействительные данные инициализации' });
    }
    
    // Получаем ID пользователя из данных инициализации
    // Для тестирования используем заглушку
    const userIdTest = Math.floor(Math.random() * 1000000);
    
    // Создаем или получаем пользователя
    const customer = await db.customers.upsert(userIdTest.toString());
    
    res.json({
      success: true,
      message: 'Успешная аутентификация',
      userId: customer.id
    });
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при аутентификации' });
  }
});

// Получение данных пользователя
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const customer = await db.customers.getById(userId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    
    res.json({
      success: true,
      user: customer
    });
  } catch (error) {
    console.error('Ошибка при получении пользователя:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получение списка товаров
router.get('/products', async (req, res) => {
  try {
    const products = await db.products.getAll();
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Поиск товаров
router.get('/products/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      const products = await db.products.getAll();
      return res.json({
        success: true,
        products
      });
    }
    
    const products = await db.products.search(query);
    
    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Ошибка при поиске товаров:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получение списка FAQ
router.get('/faqs', async (req, res) => {
  try {
    const faqs = await db.faqs.getAll();
    
    res.json({
      success: true,
      faqs
    });
  } catch (error) {
    console.error('Ошибка при получении FAQ:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Получение рекомендаций по подготовке
router.get('/preparations/:serviceType', (req, res) => {
  const { serviceType } = req.params;
  
  const preparation = db.care.getPreparation(serviceType);
  
  if (!preparation) {
    return res.status(404).json({ success: false, message: 'Рекомендации не найдены' });
  }
  
  res.json({
    success: true,
    preparation
  });
});

// Получение рекомендаций после процедуры
router.get('/aftercare/:serviceType', (req, res) => {
  const { serviceType } = req.params;
  
  const aftercareInfo = db.care.getAftercare(serviceType);
  
  if (!aftercareInfo) {
    return res.status(404).json({ success: false, message: 'Рекомендации не найдены' });
  }
  
  res.json({
    success: true,
    aftercare: aftercareInfo
  });
});

// Получение рекомендуемых интервалов между процедурами
router.get('/intervals/:serviceType', (req, res) => {
  const { serviceType } = req.params;
  
  const interval = db.care.getInterval(serviceType);
  
  if (!interval) {
    return res.status(404).json({ success: false, message: 'Интервал не найден' });
  }
  
  res.json({
    success: true,
    interval
  });
});

// Запись на процедуру
router.post('/appointments', async (req, res) => {
  try {
    const { userId, service, date, time, comments } = req.body;
    
    if (!userId || !service || !date || !time) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // Создаем запись
    const newAppointment = await db.appointments.create({
      userId,
      service,
      date,
      time,
      comments: comments || ''
    });
    
    // В реальном приложении здесь будет отправка уведомления через Телеграм Бота
    // sendTelegramNotification(userId, `Вы записаны на ${service} ${date} в ${time}`);
    
    res.json({
      success: true,
      message: 'Запись успешно создана',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('Ошибка при создании записи:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при создании записи' });
  }
});

// Получение записей пользователя
router.get('/appointments/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const customer = await db.customers.getById(userId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Пользователь не найден' });
    }
    
    const userAppointments = await db.appointments.getByUserId(userId);
    
    res.json({
      success: true,
      appointments: userAppointments
    });
  } catch (error) {
    console.error('Ошибка при получении записей:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера' });
  }
});

// Оценка визита
router.post('/feedback', async (req, res) => {
  try {
    const { userId, appointmentId, rating, comments } = req.body;
    
    if (!userId || !appointmentId || !rating) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // Находим запись
    const appointment = await db.appointments.getById(parseInt(appointmentId));
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Запись не найдена' });
    }
    
    // Добавляем оценку
    const updatedAppointment = await db.appointments.addFeedback(parseInt(appointmentId), {
      rating: parseInt(rating),
      comments: comments || ''
    });
    
    res.json({
      success: true,
      message: 'Оценка успешно добавлена',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Ошибка при добавлении оценки:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при добавлении оценки' });
  }
});

// Отправка рекомендаций друзьям
router.post('/referrals', (req, res) => {
  try {
    const { userId, referrals } = req.body;
    
    if (!userId || !referrals || !Array.isArray(referrals) || referrals.length === 0) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // В реальном приложении здесь будет сохранение рекомендаций в базу данных
    // и отправка сообщений через Телеграм Бота
    
    res.json({
      success: true,
      message: 'Рекомендации успешно отправлены',
      count: referrals.length
    });
  } catch (error) {
    console.error('Ошибка при отправке рекомендаций:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при отправке рекомендаций' });
  }
});

// Загрузка фото
router.post('/photo-upload', (req, res) => {
  try {
    const { userId, zone, comments } = req.body;
    
    if (!userId || !zone) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // В реальном приложении здесь будет сохранение фото и отправка уведомления
    
    res.json({
      success: true,
      message: 'Фото успешно загружено',
      photoId: Math.floor(Math.random() * 1000000)
    });
  } catch (error) {
    console.error('Ошибка при загрузке фото:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при загрузке фото' });
  }
});

// Оформление заказа
router.post('/order', async (req, res) => {
  try {
    const { userId, products, total } = req.body;
    
    if (!userId || !products || !Array.isArray(products) || products.length === 0 || !total) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // Создаем заказ
    const newOrder = await db.orders.create({
      userId,
      products,
      total
    });
    
    res.json({
      success: true,
      message: 'Заказ успешно оформлен',
      orderId: newOrder.id,
      total
    });
  } catch (error) {
    console.error('Ошибка при оформлении заказа:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при оформлении заказа' });
  }
});

// Отправка сообщения администратору
router.post('/chat', (req, res) => {
  try {
    const { userId, message } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'Не все обязательные поля заполнены' });
    }
    
    // В реальном приложении здесь будет сохранение сообщения и отправка уведомления
    
    res.json({
      success: true,
      message: 'Сообщение успешно отправлено',
      messageId: Math.floor(Math.random() * 1000000)
    });
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    res.status(500).json({ success: false, message: 'Ошибка сервера при отправке сообщения' });
  }
});

// Функция для отправки уведомлений через Telegram Bot API (заглушка)
async function sendTelegramNotification(userId, message) {
  try {
    // В реальном приложении здесь будет запрос к Telegram Bot API
    // const response = await axios.post(
    //   `https://api.telegram.org/bot${botToken}/sendMessage`,
    //   {
    //     chat_id: userId,
    //     text: message
    //   }
    // );
    
    console.log(`Уведомление для ${userId}: ${message}`);
    return true;
  } catch (error) {
    console.error('Ошибка при отправке уведомления в Телеграм:', error);
    return false;
  }
}

module.exports = router; 