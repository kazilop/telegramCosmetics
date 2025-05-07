/**
 * Файл для работы с базой данных PostgreSQL
 */
const { Pool } = require('pg');
const { db } = require('./config');

// Создаем пул соединений с базой данных
const pool = new Pool({
  host: db.host,
  port: db.port,
  database: db.database,
  user: db.user,
  password: db.password
});

// Временное хранилище данных в памяти (для тестирования, если БД не доступна)
const memoryDb = {
  customers: {},
  appointments: [],
  products: [
    { id: 1, name: 'Крем для лица', price: 1200, category: 'Уход за лицом', image: '/images/face-cream.jpg', description: 'Увлажняющий крем для лица с гиалуроновой кислотой' },
    { id: 2, name: 'Сыворотка для волос', price: 950, category: 'Уход за волосами', image: '/images/hair-serum.jpg', description: 'Восстанавливающая сыворотка для поврежденных волос' },
    { id: 3, name: 'Гель для умывания', price: 750, category: 'Уход за лицом', image: '/images/face-wash.jpg', description: 'Очищающий гель для всех типов кожи' },
    { id: 4, name: 'Маска для лица', price: 850, category: 'Уход за лицом', image: '/images/face-mask.jpg', description: 'Питательная маска для сияния кожи' }
  ],
  faqs: [
    { id: 1, question: 'Как часто нужно делать процедуру?', answer: 'Рекомендуемая частота зависит от типа процедуры. Обычно 1 раз в 2-4 недели.' },
    { id: 2, question: 'Сколько длится эффект?', answer: 'Эффект от процедуры обычно длится 3-6 месяцев в зависимости от индивидуальных особенностей.' },
    { id: 3, question: 'Есть ли противопоказания?', answer: 'Да, у большинства процедур есть противопоказания. Проконсультируйтесь со специалистом перед записью.' },
    { id: 4, question: 'Что делать перед процедурой?', answer: 'Перед процедурой рекомендуется избегать загара, алкоголя и воздействия на кожу агрессивных средств.' },
    { id: 5, question: 'Что делать после процедуры?', answer: 'После процедуры следуйте индивидуальным рекомендациям специалиста, обычно это увлажнение кожи и защита от солнца.' }
  ],
  orders: [],
  chats: {},
  referrals: []
};

// Справочники
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

// Публичный метод инициализации для использования в server-render.js
async function init() {
  return initDB();
}

// Инициализация базы данных
async function initDB() {
  try {
    // Создаем таблицы, если они не существуют
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        telegram_id VARCHAR(100) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        balance DECIMAL(10, 2) DEFAULT 0,
        visits INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        service VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        comments TEXT,
        status VARCHAR(20) DEFAULT 'upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100),
        image VARCHAR(200),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customers(id),
        total DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id),
        rating INTEGER NOT NULL,
        comments TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL
      );
    `);
    
    // Проверяем, есть ли данные в таблице products, если нет - добавляем начальные данные
    const productsCount = await pool.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('Добавление начальных данных в таблицу products...');
      await Promise.all(memoryDb.products.map(product => {
        return pool.query(`
          INSERT INTO products(name, price, category, image, description) 
          VALUES($1, $2, $3, $4, $5)
        `, [product.name, product.price, product.category, product.image, product.description]);
      }));
    }
    
    // Проверяем, есть ли данные в таблице faqs, если нет - добавляем начальные данные
    const faqsCount = await pool.query('SELECT COUNT(*) FROM faqs');
    
    if (parseInt(faqsCount.rows[0].count) === 0) {
      console.log('Добавление начальных данных в таблицу faqs...');
      await Promise.all(memoryDb.faqs.map(faq => {
        return pool.query(`
          INSERT INTO faqs(question, answer) 
          VALUES($1, $2)
        `, [faq.question, faq.answer]);
      }));
    }
    
    console.log('База данных успешно инициализирована');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    console.log('Используем резервное хранилище в памяти');
  }
}

// Методы для работы с клиентами
const customers = {
  /**
   * Создание или обновление клиента
   * @param {string} userId - ID пользователя
   * @param {Object} data - Данные клиента
   * @returns {Object} - Обновленные данные клиента
   */
  async upsert(userId, data = {}) {
    try {
      const result = await pool.query(`
        INSERT INTO customers (telegram_id, first_name, last_name)
        VALUES ($1, $2, $3)
        ON CONFLICT (telegram_id) 
        DO UPDATE SET 
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
        RETURNING *
      `, [userId, data.first_name || null, data.last_name || null]);
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка при создании/обновлении клиента:', error);
      
      // Резервный вариант с хранением в памяти
      if (!memoryDb.customers[userId]) {
        memoryDb.customers[userId] = {
          id: userId,
          balance: 0,
          visits: 0,
          appointments: [],
          createdAt: new Date().toISOString()
        };
      }
      
      Object.assign(memoryDb.customers[userId], data);
      
      return memoryDb.customers[userId];
    }
  },
  
  /**
   * Получение клиента по ID
   * @param {string} userId - ID пользователя
   * @returns {Object|null} - Данные клиента
   */
  async getById(userId) {
    try {
      const result = await pool.query(`
        SELECT * FROM customers WHERE telegram_id = $1
      `, [userId]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении клиента:', error);
      return memoryDb.customers[userId] || null;
    }
  },
  
  /**
   * Обновление баланса клиента
   * @param {string} userId - ID пользователя
   * @param {number} amount - Сумма изменения
   * @returns {Object} - Обновленные данные клиента
   */
  async updateBalance(userId, amount) {
    try {
      const result = await pool.query(`
        UPDATE customers 
        SET balance = balance + $1 
        WHERE telegram_id = $2
        RETURNING *
      `, [amount, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Клиент не найден');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
      
      if (!memoryDb.customers[userId]) {
        throw new Error('Клиент не найден');
      }
      
      memoryDb.customers[userId].balance += amount;
      
      return memoryDb.customers[userId];
    }
  },
  
  /**
   * Увеличение счетчика посещений
   * @param {string} userId - ID пользователя
   * @returns {Object} - Обновленные данные клиента
   */
  async incrementVisits(userId) {
    try {
      const result = await pool.query(`
        UPDATE customers 
        SET visits = visits + 1 
        WHERE telegram_id = $1
        RETURNING *
      `, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Клиент не найден');
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка при увеличении счетчика посещений:', error);
      
      if (!memoryDb.customers[userId]) {
        throw new Error('Клиент не найден');
      }
      
      memoryDb.customers[userId].visits += 1;
      
      return memoryDb.customers[userId];
    }
  }
};

// Методы для работы с записями
const appointments = {
  /**
   * Создание новой записи
   * @param {Object} data - Данные записи
   * @returns {Object} - Созданная запись
   */
  async create(data) {
    try {
      // Получаем ID клиента по telegram_id
      const customerResult = await pool.query(`
        SELECT id FROM customers WHERE telegram_id = $1
      `, [data.userId]);
      
      if (customerResult.rows.length === 0) {
        throw new Error('Клиент не найден');
      }
      
      const customerId = customerResult.rows[0].id;
      
      const result = await pool.query(`
        INSERT INTO appointments (customer_id, service, date, time, comments, status)
        VALUES ($1, $2, $3, $4, $5, 'upcoming')
        RETURNING *
      `, [customerId, data.service, data.date, data.time, data.comments || '']);
      
      return result.rows[0];
    } catch (error) {
      console.error('Ошибка при создании записи:', error);
      
      // Резервный вариант с хранением в памяти
      const newAppointment = {
        id: memoryDb.appointments.length + 1,
        ...data,
        status: 'upcoming',
        createdAt: new Date().toISOString()
      };
      
      memoryDb.appointments.push(newAppointment);
      
      // Добавляем запись в профиль пользователя
      if (memoryDb.customers[data.userId]) {
        if (!memoryDb.customers[data.userId].appointments) {
          memoryDb.customers[data.userId].appointments = [];
        }
        
        memoryDb.customers[data.userId].appointments.push(newAppointment.id);
      }
      
      return newAppointment;
    }
  },
  
  /**
   * Получение всех записей пользователя
   * @param {string} userId - ID пользователя
   * @returns {Array} - Массив записей
   */
  async getByUserId(userId) {
    try {
      const result = await pool.query(`
        SELECT a.* 
        FROM appointments a
        JOIN customers c ON a.customer_id = c.id
        WHERE c.telegram_id = $1
        ORDER BY a.date DESC, a.time DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении записей:', error);
      return memoryDb.appointments.filter(a => a.userId === userId);
    }
  },
  
  /**
   * Получение записи по ID
   * @param {number} id - ID записи
   * @returns {Object|null} - Запись
   */
  async getById(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM appointments WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении записи:', error);
      return memoryDb.appointments.find(a => a.id === id) || null;
    }
  },
  
  /**
   * Обновление статуса записи
   * @param {number} id - ID записи
   * @param {string} status - Новый статус
   * @returns {Object|null} - Обновленная запись
   */
  async updateStatus(id, status) {
    try {
      const result = await pool.query(`
        UPDATE appointments 
        SET status = $1 
        WHERE id = $2
        RETURNING *
      `, [status, id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
      
      const index = memoryDb.appointments.findIndex(a => a.id === id);
      
      if (index === -1) {
        return null;
      }
      
      memoryDb.appointments[index].status = status;
      
      return memoryDb.appointments[index];
    }
  },
  
  /**
   * Добавление отзыва к записи
   * @param {number} id - ID записи
   * @param {Object} feedback - Данные отзыва
   * @returns {Object|null} - Обновленная запись
   */
  async addFeedback(id, feedback) {
    try {
      await pool.query(`
        INSERT INTO feedback (appointment_id, rating, comments)
        VALUES ($1, $2, $3)
      `, [id, feedback.rating, feedback.comments || '']);
      
      // Получаем обновленную запись
      const result = await pool.query(`
        SELECT a.*, f.rating, f.comments as feedback_comments
        FROM appointments a
        LEFT JOIN feedback f ON a.id = f.appointment_id
        WHERE a.id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при добавлении отзыва:', error);
      
      const index = memoryDb.appointments.findIndex(a => a.id === id);
      
      if (index === -1) {
        return null;
      }
      
      memoryDb.appointments[index].feedback = {
        ...feedback,
        date: new Date().toISOString()
      };
      
      return memoryDb.appointments[index];
    }
  }
};

// Методы для работы с товарами
const products = {
  /**
   * Получение всех товаров
   * @returns {Array} - Массив товаров
   */
  async getAll() {
    try {
      const result = await pool.query(`
        SELECT * FROM products ORDER BY name
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении всех товаров:', error);
      return memoryDb.products;
    }
  },
  
  /**
   * Поиск товаров
   * @param {string} query - Строка поиска
   * @returns {Array} - Массив найденных товаров
   */
  async search(query) {
    try {
      query = query.toLowerCase();
      
      const result = await pool.query(`
        SELECT * FROM products
        WHERE 
          LOWER(name) LIKE $1 OR
          LOWER(description) LIKE $1 OR
          LOWER(category) LIKE $1
        ORDER BY name
      `, [`%${query}%`]);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка при поиске товаров:', error);
      
      query = query.toLowerCase();
      
      return memoryDb.products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      );
    }
  },
  
  /**
   * Получение товара по ID
   * @param {number} id - ID товара
   * @returns {Object|null} - Товар
   */
  async getById(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM products WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении товара по ID:', error);
      return memoryDb.products.find(p => p.id === id) || null;
    }
  }
};

// Методы для работы с заказами
const orders = {
  /**
   * Создание нового заказа
   * @param {Object} data - Данные заказа
   * @returns {Object} - Созданный заказ
   */
  async create(data) {
    try {
      // Получаем ID клиента по telegram_id
      const customerResult = await pool.query(`
        SELECT id FROM customers WHERE telegram_id = $1
      `, [data.userId]);
      
      if (customerResult.rows.length === 0) {
        throw new Error('Клиент не найден');
      }
      
      const customerId = customerResult.rows[0].id;
      
      // Начинаем транзакцию
      await pool.query('BEGIN');
      
      // Создаем заказ
      const orderResult = await pool.query(`
        INSERT INTO orders (customer_id, total, status)
        VALUES ($1, $2, 'processing')
        RETURNING *
      `, [customerId, data.total]);
      
      const orderId = orderResult.rows[0].id;
      
      // Добавляем товары заказа
      for (const item of data.products) {
        await pool.query(`
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ($1, $2, $3, $4)
        `, [orderId, item.id, item.quantity, item.price]);
      }
      
      // Завершаем транзакцию
      await pool.query('COMMIT');
      
      return orderResult.rows[0];
    } catch (error) {
      // Откатываем транзакцию в случае ошибки
      try {
        await pool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Ошибка при откате транзакции:', rollbackError);
      }
      
      console.error('Ошибка при создании заказа:', error);
      
      // Резервный вариант с хранением в памяти
      const newOrder = {
        id: memoryDb.orders.length + 1,
        ...data,
        status: 'processing',
        createdAt: new Date().toISOString()
      };
      
      memoryDb.orders.push(newOrder);
      
      return newOrder;
    }
  },
  
  /**
   * Получение всех заказов пользователя
   * @param {string} userId - ID пользователя
   * @returns {Array} - Массив заказов
   */
  async getByUserId(userId) {
    try {
      const result = await pool.query(`
        SELECT o.* 
        FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE c.telegram_id = $1
        ORDER BY o.created_at DESC
      `, [userId]);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении заказов:', error);
      return memoryDb.orders.filter(o => o.userId === userId);
    }
  },
  
  /**
   * Получение заказа по ID
   * @param {number} id - ID заказа
   * @returns {Object|null} - Заказ
   */
  async getById(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM orders WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении заказа по ID:', error);
      return memoryDb.orders.find(o => o.id === id) || null;
    }
  },
  
  /**
   * Обновление статуса заказа
   * @param {number} id - ID заказа
   * @param {string} status - Новый статус
   * @returns {Object|null} - Обновленный заказ
   */
  async updateStatus(id, status) {
    try {
      const result = await pool.query(`
        UPDATE orders 
        SET status = $1 
        WHERE id = $2
        RETURNING *
      `, [status, id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при обновлении статуса заказа:', error);
      
      const index = memoryDb.orders.findIndex(o => o.id === id);
      
      if (index === -1) {
        return null;
      }
      
      memoryDb.orders[index].status = status;
      
      return memoryDb.orders[index];
    }
  }
};

// Методы для работы с часто задаваемыми вопросами
const faqs = {
  /**
   * Получение всех FAQ
   * @returns {Array} - Массив вопросов/ответов
   */
  async getAll() {
    try {
      const result = await pool.query(`
        SELECT * FROM faqs ORDER BY id
      `);
      
      return result.rows;
    } catch (error) {
      console.error('Ошибка при получении всех FAQ:', error);
      return memoryDb.faqs;
    }
  },
  
  /**
   * Получение FAQ по ID
   * @param {number} id - ID вопроса
   * @returns {Object|null} - Вопрос/ответ
   */
  async getById(id) {
    try {
      const result = await pool.query(`
        SELECT * FROM faqs WHERE id = $1
      `, [id]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Ошибка при получении FAQ по ID:', error);
      return memoryDb.faqs.find(f => f.id === id) || null;
    }
  }
};

// Методы для работы с рекомендациями по уходу
const care = {
  /**
   * Получение рекомендаций по подготовке
   * @param {string} serviceType - Тип услуги
   * @returns {string|null} - Текст рекомендаций
   */
  getPreparation(serviceType) {
    return preparations[serviceType] || null;
  },
  
  /**
   * Получение рекомендаций после процедуры
   * @param {string} serviceType - Тип услуги
   * @returns {string|null} - Текст рекомендаций
   */
  getAftercare(serviceType) {
    return aftercare[serviceType] || null;
  },
  
  /**
   * Получение рекомендуемых интервалов
   * @param {string} serviceType - Тип услуги
   * @returns {string|null} - Текст рекомендаций
   */
  getInterval(serviceType) {
    return intervals[serviceType] || null;
  }
};

// Экспортируем методы
module.exports = {
  init,
  customers,
  appointments,
  products,
  orders,
  faqs,
  care,
  referrals
}; 