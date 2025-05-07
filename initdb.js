/**
 * Скрипт для инициализации базы данных PostgreSQL
 */
const { Pool } = require('pg');
const { db } = require('./config');

// Данные для инициализации
const products = [
  { name: 'Крем для лица', price: 1200, category: 'Уход за лицом', image: '/images/face-cream.jpg', description: 'Увлажняющий крем для лица с гиалуроновой кислотой' },
  { name: 'Сыворотка для волос', price: 950, category: 'Уход за волосами', image: '/images/hair-serum.jpg', description: 'Восстанавливающая сыворотка для поврежденных волос' },
  { name: 'Гель для умывания', price: 750, category: 'Уход за лицом', image: '/images/face-wash.jpg', description: 'Очищающий гель для всех типов кожи' },
  { name: 'Маска для лица', price: 850, category: 'Уход за лицом', image: '/images/face-mask.jpg', description: 'Питательная маска для сияния кожи' }
];

const faqs = [
  { question: 'Как часто нужно делать процедуру?', answer: 'Рекомендуемая частота зависит от типа процедуры. Обычно 1 раз в 2-4 недели.' },
  { question: 'Сколько длится эффект?', answer: 'Эффект от процедуры обычно длится 3-6 месяцев в зависимости от индивидуальных особенностей.' },
  { question: 'Есть ли противопоказания?', answer: 'Да, у большинства процедур есть противопоказания. Проконсультируйтесь со специалистом перед записью.' },
  { question: 'Что делать перед процедурой?', answer: 'Перед процедурой рекомендуется избегать загара, алкоголя и воздействия на кожу агрессивных средств.' },
  { question: 'Что делать после процедуры?', answer: 'После процедуры следуйте индивидуальным рекомендациям специалиста, обычно это увлажнение кожи и защита от солнца.' }
];

async function initializeDatabase() {
  // Проверяем, что пароль - это строка
  if (typeof db.password !== 'string') {
    console.error('Ошибка: пароль базы данных не является строкой или не указан');
    process.exit(1);
  }

  console.log('Используем параметры подключения:');
  console.log(`  Хост: ${db.host}`);
  console.log(`  Порт: ${db.port}`);
  console.log(`  Пользователь: ${db.user}`);
  console.log(`  База данных: ${db.database}`);

  const pool = new Pool({
    host: db.host,
    port: db.port,
    user: db.user,
    password: db.password,
    database: 'postgres' // Сначала подключаемся к системной базе postgres
  });

  try {
    console.log('Проверка существования базы данных...');
    
    // Проверяем существование базы данных
    const checkDbResult = await pool.query(`
      SELECT 1 FROM pg_database WHERE datname = $1
    `, [db.database]);
    
    // Если база данных не существует, создаем ее
    if (checkDbResult.rows.length === 0) {
      console.log(`База данных "${db.database}" не существует. Создание...`);
      await pool.query(`CREATE DATABASE ${db.database}`);
      console.log(`База данных "${db.database}" успешно создана!`);
    } else {
      console.log(`База данных "${db.database}" уже существует.`);
    }
    
    // Закрываем соединение с сервером PostgreSQL
    await pool.end();
    
    // Подключаемся к созданной базе данных
    const dbPool = new Pool({
      host: db.host,
      port: db.port,
      database: db.database,
      user: db.user,
      password: db.password
    });
    
    console.log('Создание таблиц...');
    
    // Создаем таблицы
    await dbPool.query(`
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
    
    console.log('Таблицы успешно созданы!');
    
    // Проверяем, есть ли данные в таблице products, если нет - добавляем начальные данные
    const productsCount = await dbPool.query('SELECT COUNT(*) FROM products');
    
    if (parseInt(productsCount.rows[0].count) === 0) {
      console.log('Добавление начальных данных в таблицу products...');
      await Promise.all(products.map(product => {
        return dbPool.query(`
          INSERT INTO products(name, price, category, image, description) 
          VALUES($1, $2, $3, $4, $5)
        `, [product.name, product.price, product.category, product.image, product.description]);
      }));
      console.log('Товары успешно добавлены!');
    } else {
      console.log('Таблица products уже содержит данные.');
    }
    
    // Проверяем, есть ли данные в таблице faqs, если нет - добавляем начальные данные
    const faqsCount = await dbPool.query('SELECT COUNT(*) FROM faqs');
    
    if (parseInt(faqsCount.rows[0].count) === 0) {
      console.log('Добавление начальных данных в таблицу faqs...');
      await Promise.all(faqs.map(faq => {
        return dbPool.query(`
          INSERT INTO faqs(question, answer) 
          VALUES($1, $2)
        `, [faq.question, faq.answer]);
      }));
      console.log('FAQ успешно добавлены!');
    } else {
      console.log('Таблица faqs уже содержит данные.');
    }
    
    console.log('База данных успешно инициализирована!');
    
    // Закрываем соединение с базой данных
    await dbPool.end();
    
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  }
}

// Запуск инициализации
initializeDatabase(); 