# 🚀 Discord Tracker Pro - Инструкция по запуску

## 📋 Требования

- **Node.js** версии 16 или выше
- **MongoDB** (используется MongoDB Atlas)
- **Discord Application** для OAuth

## 🔧 Настройка Discord Application

### 1. Создание Discord Application
1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Нажмите "New Application"
3. Введите название (например, "Discord Tracker Pro")
4. Скопируйте **Client ID** и **Client Secret**

### 2. Настройка OAuth2
1. В меню слева выберите "OAuth2"
2. В разделе "Redirects" добавьте: `http://localhost:3000/auth/discord/callback`
3. В разделе "Scopes" выберите:
   - `identify`
   - `email`
   - `guilds`

## 🗄️ Настройка MongoDB

### 1. MongoDB Atlas (рекомендуется)
1. Создайте аккаунт на [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Создайте новый кластер
3. Создайте пользователя базы данных
4. Получите строку подключения

### 2. Локальная MongoDB
```bash
# Установка MongoDB (Ubuntu/Debian)
sudo apt update
sudo apt install mongodb

# Запуск MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## ⚙️ Настройка проекта

### 1. Установка зависимостей
```bash
npm install
```

### 2. Настройка переменных окружения
Отредактируйте файл `config.env`:

```env
# Discord OAuth Configuration
DISCORD_CLIENT_ID=ваш_discord_client_id
DISCORD_CLIENT_SECRET=ваш_discord_client_secret
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback

# MongoDB Connection
MONGODB_URI=mongodb+srv://killmysoulasd:FDEUUxBfPrgaiGtw@zxc.enzydxy.mongodb.net/discord_tracker

# JWT Secret (сгенерируйте случайную строку)
JWT_SECRET=ваш_супер_секретный_ключ_здесь

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret (сгенерируйте случайную строку)
SESSION_SECRET=ваш_секрет_сессии_здесь
```

### 3. Генерация секретных ключей
```bash
# Генерация JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Генерация SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Запуск приложения

### 1. Запуск сервера
```bash
# Режим разработки (с автоперезагрузкой)
npm run dev

# Продакшн режим
npm start
```

### 2. Открытие фронтенда
1. Откройте `index.htm` в браузере
2. Или используйте локальный сервер:
```bash
# Python 3
python -m http.server 5000

# Node.js
npx http-server -p 5000
```

### 3. Проверка работы
- Сервер должен запуститься на порту 3000
- Фронтенд должен быть доступен на порту 5000
- В консоли должно появиться сообщение о подключении к MongoDB

## 🔍 Тестирование

### 1. Проверка аутентификации
1. Откройте приложение в браузере
2. Нажмите "Войти через Discord"
3. Авторизуйтесь через Discord
4. Должен отобразиться ваш профиль

### 2. Тестирование поиска
1. Войдите в приложение
2. Введите Discord ID (18-19 цифр)
3. Нажмите Enter или кнопку поиска
4. Должен загрузиться профиль пользователя

### 3. Тестирование отслеживания
1. Найдите пользователя через поиск
2. Нажмите "Добавить в отслеживание"
3. Перейдите в раздел "Отслеживание"
4. Пользователь должен появиться в списке

## 🐛 Устранение неполадок

### Ошибка подключения к MongoDB
```
❌ MongoDB connection error: ...
```
**Решение:**
- Проверьте строку подключения в `config.env`
- Убедитесь, что MongoDB запущен
- Проверьте сетевые настройки

### Ошибка Discord OAuth
```
❌ Discord authentication failed
```
**Решение:**
- Проверьте Client ID и Client Secret
- Убедитесь, что callback URL настроен правильно
- Проверьте scopes в Discord Developer Portal

### Ошибка CORS
```
❌ CORS error: ...
```
**Решение:**
- Проверьте настройки CORS в `server.js`
- Убедитесь, что фронтенд и бэкенд работают на правильных портах

### Проблемы с сессиями
```
❌ Session error: ...
```
**Решение:**
- Проверьте SESSION_SECRET в `config.env`
- Убедитесь, что куки включены в браузере
- Проверьте настройки secure cookies

## 📁 Структура проекта

```
DiscordChecker_FrontEnd/
├── index.htm              # Главная страница
├── style.css              # Стили
├── script.js              # Фронтенд логика
├── config.env             # Переменные окружения
├── package.json           # Зависимости Node.js
├── server.js              # Express сервер
├── models/                # MongoDB модели
│   ├── User.js           # Модель пользователя
│   └── TrackedUser.js    # Модель отслеживаемого пользователя
└── SETUP.md              # Эта инструкция
```

## 🔒 Безопасность

### Важные моменты:
- **НЕ коммитьте** `config.env` в Git
- Используйте **сильные секретные ключи**
- В продакшене используйте **HTTPS**
- Ограничьте доступ к MongoDB
- Регулярно обновляйте зависимости

### Продакшн настройки:
```env
NODE_ENV=production
PORT=80
SECURE_COOKIES=true
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте консоль браузера на ошибки
2. Проверьте логи сервера
3. Убедитесь, что все зависимости установлены
4. Проверьте настройки Discord Application
5. Проверьте подключение к MongoDB

## 🎯 Следующие шаги

После успешного запуска:

1. **Настройте уведомления** в Discord
2. **Добавьте больше функций** отслеживания
3. **Интегрируйте с другими API**
4. **Добавьте аналитику** и графики
5. **Настройте мониторинг** и логирование

---

**Удачи с Discord Tracker Pro! 🚀**
