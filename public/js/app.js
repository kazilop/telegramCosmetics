// Инициализация Telegram Web App
let tg = window.Telegram.WebApp;
tg.expand();

// Основные элементы
const loader = document.getElementById('loader');
const mainContent = document.getElementById('main-content');
const navItems = document.querySelectorAll('.nav-item');

// Шаблоны
const templates = {
  home: document.getElementById('home-template'),
  appointments: document.getElementById('appointments-template'),
  shop: document.getElementById('shop-template'),
  profile: document.getElementById('profile-template'),
  appointmentForm: document.getElementById('appointment-form-template'),
  feedbackForm: document.getElementById('feedback-form-template'),
  referralForm: document.getElementById('referral-form-template'),
  chat: document.getElementById('chat-template'),
  photoUpload: document.getElementById('photo-upload-template')
};

// Текущая страница
let currentPage = 'home';

// Инициализация приложения
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Скрываем лоадер
  setTimeout(() => {
    loader.classList.add('hidden');
    mainContent.classList.remove('hidden');
  }, 800);

  // Загружаем данные
  loadUserData();
  
  // Отображаем домашнюю страницу
  showPage('home');

  // Обработчики событий навигации
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const page = item.getAttribute('data-page');
      showPage(page);
    });
  });
}

// Загрузка данных пользователя (заглушка)
function loadUserData() {
  // Здесь будет запрос к API для получения данных пользователя
  return {
    id: tg.initDataUnsafe?.user?.id || "unknown",
    name: tg.initDataUnsafe?.user?.first_name || "Гость",
    balance: 3000,
    visits: 5
  };
}

// Отображение страницы
function showPage(page) {
  // Обновляем активную навигацию
  navItems.forEach(item => {
    if (item.getAttribute('data-page') === page) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Очищаем контент
  mainContent.innerHTML = '';
  
  // Клонируем шаблон страницы
  const template = templates[page];
  if (!template) return;
  
  const clone = document.importNode(template.content, true);
  mainContent.appendChild(clone);
  
  // Обрабатываем контент страницы
  switch (page) {
    case 'home':
      setupHomePage();
      break;
    case 'appointments':
      setupAppointmentsPage();
      break;
    case 'shop':
      setupShopPage();
      break;
    case 'profile':
      setupProfilePage();
      break;
  }
  
  currentPage = page;
}

// Настройка домашней страницы
function setupHomePage() {
  const btnBookAppointment = document.getElementById('btn-book-appointment');
  const btnAllFaqs = document.getElementById('btn-all-faqs');
  const btnPreparations = document.getElementById('btn-preparations');
  const btnAftercare = document.getElementById('btn-aftercare');
  const btnFeedback = document.getElementById('btn-feedback');
  const btnChat = document.getElementById('btn-chat');
  
  if (btnBookAppointment) {
    btnBookAppointment.addEventListener('click', showAppointmentForm);
  }
  
  if (btnFeedback) {
    btnFeedback.addEventListener('click', showFeedbackForm);
  }
  
  if (btnChat) {
    btnChat.addEventListener('click', showChatModal);
  }
  
  // Загрузка и отображение FAQ
  loadFAQs();
}

// Настройка страницы записей
function setupAppointmentsPage() {
  const btnNewAppointment = document.getElementById('btn-new-appointment');
  
  if (btnNewAppointment) {
    btnNewAppointment.addEventListener('click', showAppointmentForm);
  }
  
  // Загрузка и отображение записей
  loadAppointments();
  
  // Отображение информации о посещениях
  const visitsCount = document.getElementById('visits-count');
  const balance = document.getElementById('balance');
  
  if (visitsCount && balance) {
    const userData = loadUserData();
    visitsCount.textContent = userData.visits;
    balance.textContent = userData.balance;
  }
}

// Настройка страницы магазина
function setupShopPage() {
  const searchProducts = document.getElementById('search-products');
  
  if (searchProducts) {
    searchProducts.addEventListener('input', (e) => {
      filterProducts(e.target.value);
    });
  }
  
  // Загрузка и отображение товаров
  loadProducts();
}

// Настройка страницы профиля
function setupProfilePage() {
  const btnSubscription = document.getElementById('btn-subscription');
  const btnPhotoCheck = document.getElementById('btn-photo-check');
  const btnReferFriend = document.getElementById('btn-refer-friend');
  
  if (btnPhotoCheck) {
    btnPhotoCheck.addEventListener('click', showPhotoUploadForm);
  }
  
  if (btnReferFriend) {
    btnReferFriend.addEventListener('click', showReferralForm);
  }
  
  // Отображение информации о пользователе
  const userId = document.getElementById('user-id');
  const userVisits = document.getElementById('user-visits');
  const userBalance = document.getElementById('user-balance');
  
  if (userId && userVisits && userBalance) {
    const userData = loadUserData();
    userId.textContent = userData.id;
    userVisits.textContent = userData.visits;
    userBalance.textContent = userData.balance;
  }
}

// Загрузка и отображение FAQ (заглушка)
function loadFAQs() {
  const faqList = document.getElementById('faq-list');
  if (!faqList) return;
  
  const faqs = [
    { question: 'Как часто нужно делать процедуру?', answer: 'Рекомендуемая частота зависит от типа процедуры. Обычно 1 раз в 2-4 недели.' },
    { question: 'Сколько длится эффект?', answer: 'Эффект от процедуры обычно длится 3-6 месяцев в зависимости от индивидуальных особенностей.' },
    { question: 'Есть ли противопоказания?', answer: 'Да, у большинства процедур есть противопоказания. Проконсультируйтесь со специалистом перед записью.' }
  ];
  
  faqs.forEach(faq => {
    const item = document.createElement('div');
    item.className = 'faq-item';
    item.innerHTML = `
      <h3>${faq.question}</h3>
      <p>${faq.answer}</p>
    `;
    faqList.appendChild(item);
  });
}

// Загрузка и отображение записей (заглушка)
function loadAppointments() {
  const appointmentsList = document.getElementById('appointments-list');
  if (!appointmentsList) return;
  
  const appointments = [
    { id: 1, service: 'Уход за лицом', date: '2023-05-15', time: '14:00', status: 'completed' },
    { id: 2, service: 'Массаж', date: '2023-06-20', time: '11:00', status: 'upcoming' }
  ];
  
  appointments.forEach(appointment => {
    const item = document.createElement('div');
    item.className = 'list-item';
    
    const statusText = appointment.status === 'completed' ? 'Завершена' : 'Предстоит';
    const statusClass = appointment.status === 'completed' ? 'status-completed' : 'status-upcoming';
    
    item.innerHTML = `
      <div class="list-item-title">${appointment.service}</div>
      <div class="list-item-subtitle">${formatDate(appointment.date)} в ${appointment.time}</div>
      <div class="list-item-status ${statusClass}">${statusText}</div>
    `;
    
    appointmentsList.appendChild(item);
  });
}

// Загрузка и отображение товаров (заглушка)
function loadProducts() {
  const productsList = document.getElementById('products-list');
  if (!productsList) return;
  
  const products = [
    { id: 1, name: 'Крем для лица', price: 1200, image: '/images/face-cream.jpg', description: 'Увлажняющий крем для лица с гиалуроновой кислотой' },
    { id: 2, name: 'Сыворотка для волос', price: 950, image: '/images/hair-serum.jpg', description: 'Восстанавливающая сыворотка для поврежденных волос' },
    { id: 3, name: 'Гель для умывания', price: 750, image: '/images/face-wash.jpg', description: 'Очищающий гель для всех типов кожи' },
    { id: 4, name: 'Маска для лица', price: 850, image: '/images/face-mask.jpg', description: 'Питательная маска для сияния кожи' }
  ];
  
  products.forEach(product => {
    const item = document.createElement('div');
    item.className = 'product-card';
    item.innerHTML = `
      <div class="product-image" style="background-image: url('${product.image}')"></div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${product.price} руб.</div>
        <button class="btn btn-primary btn-add-to-cart" data-id="${product.id}">В корзину</button>
      </div>
    `;
    
    productsList.appendChild(item);
  });
  
  // Обработчики добавления в корзину
  const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const productId = e.target.getAttribute('data-id');
      addToCart(productId);
    });
  });
}

// Фильтрация товаров
function filterProducts(query) {
  const productCards = document.querySelectorAll('.product-card');
  
  query = query.toLowerCase();
  
  productCards.forEach(card => {
    const name = card.querySelector('.product-name').textContent.toLowerCase();
    
    if (name.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Отображение формы записи
function showAppointmentForm() {
  const modalTemplate = templates.appointmentForm;
  if (!modalTemplate) return;
  
  const modal = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modal);
  
  const closeBtn = document.querySelector('.btn-close');
  const form = document.getElementById('appointment-form');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.modal').remove();
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Здесь будет отправка данных на сервер
      
      // Показываем уведомление об успешной записи
      showNotification('Вы успешно записаны на процедуру!', 'success');
      
      // Закрываем модальное окно
      document.querySelector('.modal').remove();
    });
  }
}

// Отображение формы обратной связи
function showFeedbackForm() {
  const modalTemplate = templates.feedbackForm;
  if (!modalTemplate) return;
  
  const modal = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modal);
  
  const closeBtn = document.querySelector('.btn-close');
  const form = document.getElementById('feedback-form');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.modal').remove();
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Здесь будет отправка данных на сервер
      
      // Показываем уведомление об успешной отправке
      showNotification('Спасибо за отзыв!', 'success');
      
      // Закрываем модальное окно
      document.querySelector('.modal').remove();
    });
  }
}

// Отображение формы рекомендаций
function showReferralForm() {
  const modalTemplate = templates.referralForm;
  if (!modalTemplate) return;
  
  const modal = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modal);
  
  const closeBtn = document.querySelector('.btn-close');
  const form = document.getElementById('referral-form');
  const addReferralBtn = document.getElementById('add-referral');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.modal').remove();
    });
  }
  
  if (addReferralBtn) {
    addReferralBtn.addEventListener('click', () => {
      const referralsList = document.getElementById('referrals-list');
      const referralCount = referralsList.children.length + 1;
      
      const newReferral = document.createElement('div');
      newReferral.className = 'referral-item';
      newReferral.innerHTML = `
        <div class="form-group">
          <label for="referral-name-${referralCount}">Имя:</label>
          <input type="text" id="referral-name-${referralCount}" name="name[]" required>
        </div>
        <div class="form-group">
          <label for="referral-phone-${referralCount}">Телефон:</label>
          <input type="tel" id="referral-phone-${referralCount}" name="phone[]" required>
        </div>
      `;
      
      referralsList.appendChild(newReferral);
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Здесь будет отправка данных на сервер
      
      // Показываем уведомление об успешной отправке
      showNotification('Спасибо за рекомендации!', 'success');
      
      // Закрываем модальное окно
      document.querySelector('.modal').remove();
    });
  }
}

// Отображение формы чата
function showChatModal() {
  const modalTemplate = templates.chat;
  if (!modalTemplate) return;
  
  const modal = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modal);
  
  const closeBtn = document.querySelector('.btn-close');
  const form = document.getElementById('chat-form');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.modal').remove();
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const messageInput = document.getElementById('message');
      const chatMessages = document.getElementById('chat-messages');
      
      if (messageInput && chatMessages) {
        const message = messageInput.value.trim();
        
        if (message) {
          // Добавляем сообщение пользователя
          const messageElement = document.createElement('div');
          messageElement.className = 'message user';
          messageElement.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-time">${getCurrentTime()}</div>
          `;
          
          chatMessages.appendChild(messageElement);
          
          // Очищаем поле ввода
          messageInput.value = '';
          
          // Прокручиваем чат вниз
          chatMessages.scrollTop = chatMessages.scrollHeight;
          
          // Здесь будет отправка сообщения на сервер
          
          // Имитация ответа администратора через 1 секунду
          setTimeout(() => {
            const replyElement = document.createElement('div');
            replyElement.className = 'message admin';
            replyElement.innerHTML = `
              <div class="message-content">Спасибо за обращение! Администратор ответит вам в ближайшее время.</div>
              <div class="message-time">${getCurrentTime()}</div>
            `;
            
            chatMessages.appendChild(replyElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 1000);
        }
      }
    });
  }
}

// Отображение формы загрузки фото
function showPhotoUploadForm() {
  const modalTemplate = templates.photoUpload;
  if (!modalTemplate) return;
  
  const modal = document.importNode(modalTemplate.content, true);
  document.body.appendChild(modal);
  
  const closeBtn = document.querySelector('.btn-close');
  const form = document.getElementById('photo-upload-form');
  const photoInput = document.getElementById('photo');
  const photoPreview = document.getElementById('photo-preview');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.querySelector('.modal').remove();
    });
  }
  
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          
          photoPreview.innerHTML = '';
          photoPreview.appendChild(img);
        };
        
        reader.readAsDataURL(e.target.files[0]);
      }
    });
  }
  
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Здесь будет отправка данных на сервер
      
      // Показываем уведомление об успешной отправке
      showNotification('Фото успешно отправлено!', 'success');
      
      // Закрываем модальное окно
      document.querySelector('.modal').remove();
    });
  }
}

// Добавление товара в корзину (заглушка)
function addToCart(productId) {
  // Здесь будет добавление товара в корзину
  
  showNotification('Товар добавлен в корзину', 'success');
  
  // Показываем корзину
  const cart = document.getElementById('cart');
  if (cart) {
    cart.classList.remove('hidden');
  }
}

// Вспомогательные функции

// Форматирование даты
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU');
}

// Получение текущего времени
function getCurrentTime() {
  const now = new Date();
  return `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Отображение уведомления
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Удаляем уведомление через 3 секунды
  setTimeout(() => {
    notification.remove();
  }, 3000);
} 