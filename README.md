# Discord Tracker Pro 🚀

Современное приложение для отслеживания и анализа профилей пользователей Discord с полной системой аутентификации и базой данных.

## ✨ Возможности

- 🔐 **Discord OAuth2 аутентификация**
- 📊 **Анализ профилей Discord пользователей**
- 👥 **Система отслеживания пользователей**
- 💾 **MongoDB база данных**
- 🎨 **Современный UI/UX дизайн**
- 📱 **Адаптивный интерфейс**
- 🔍 **Поиск по Discord ID**
- 📈 **Аналитика и статистика**

## 🚀 Быстрый запуск

### 1. **Запуск бэкенда:**
```bash
# В первом терминале
npm run dev
```

### 2. **Запуск фронтенда:**
```bash
# Во втором терминале
npx http-server -p 5000
```

### 3. **Или используйте готовые скрипты:**
- `start-backend.bat` - запуск бэкенда
- `start-frontend.bat` - запуск фронтенда

## 🌐 Доступ к приложению

- **Фронтенд:** http://localhost:5000
- **Бэкенд:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **Discord OAuth:** http://localhost:3000/auth/discord

## ⚙️ Конфигурация

### Discord OAuth
1. Создайте приложение на [Discord Developer Portal](https://discord.com/developers/applications)
2. Настройте OAuth2 с redirect URL: `http://localhost:3000/auth/discord/callback`
3. Обновите `config.env` с вашими данными

### MongoDB
- URI уже настроен в `config.env`
- База данных создается автоматически

## 🔧 Структура проекта

```
DiscordChecker_FrontEnd/
├── index.htm              # Главная страница
├── style.css              # Стили
├── script.js              # Фронтенд логика
├── server.js              # Бэкенд сервер
├── config.env             # Переменные окружения
├── package.json           # Зависимости
├── models/                # Модели MongoDB
│   ├── User.js           # Модель пользователя
│   └── TrackedUser.js    # Модель отслеживаемого пользователя
├── start-backend.bat      # Скрипт запуска бэкенда
└── start-frontend.bat     # Скрипт запуска фронтенда
```

## 📱 Использование

1. **Войдите через Discord** - нажмите кнопку "Войти через Discord"
2. **Поиск пользователей** - введите Discord ID в поиск
3. **Отслеживание** - добавляйте пользователей в список отслеживания
4. **Аналитика** - просматривайте статистику и активность

## 🛠️ Технологии

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, Discord OAuth2
- **Styling:** CSS Variables, Flexbox, Grid, Animations

## 🚨 Устранение неполадок

### Ошибка "Cannot GET /dashboard"
- ✅ Исправлено - теперь callback перенаправляет на главную страницу

### Ошибка "Invalid \"code\" in request"
- ✅ **НОВОЕ ИСПРАВЛЕНИЕ** - добавлена подробная диагностика OAuth
- Запустите `check-discord-config.bat` для проверки конфигурации
- Следуйте инструкциям в `DISCORD_SETUP.md`
- Убедитесь, что callback URL в Discord Developer Portal точно совпадает с настройками

### Ошибка MongoDB подключения
- Проверьте интернет соединение
- Убедитесь, что MongoDB Atlas доступен

### Ошибка Discord OAuth
- Проверьте Client ID и Client Secret в `config.env`
- Убедитесь, что redirect URL настроен правильно
- См. подробные инструкции в `DISCORD_SETUP.md`

### Порт занят
- Измените порт в `config.env` (PORT=3001)
- Или остановите процесс, использующий порт 3000

## 🔒 Безопасность

- Все секретные ключи хранятся в `config.env`
- Сессии защищены
- CORS настроен для локальной разработки
- Валидация входных данных

## 📈 Развитие

- [ ] Уведомления в реальном времени
- [ ] Экспорт данных
- [ ] API для внешних интеграций
- [ ] Мобильное приложение
- [ ] Расширенная аналитика

## 🤝 Поддержка

Если возникли проблемы:
1. Проверьте логи в консоли
2. Убедитесь, что все зависимости установлены
3. Проверьте конфигурацию в `config.env`

---

**Discord Tracker Pro** - мощный инструмент для анализа Discord профилей! 🎯
