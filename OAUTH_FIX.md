# 🔧 Исправление ошибки "Invalid \"code\" in request"

## ❌ Проблема
Ошибка "Invalid \"code\" in request" возникает при попытке аутентификации через Discord OAuth.

## ✅ Что было исправлено

### 1. Улучшена обработка ошибок OAuth
- Добавлено подробное логирование в `server.js`
- Добавлена проверка параметров callback
- Улучшена обработка ошибок Discord OAuth

### 2. Добавлена диагностика
- Создан файл `DISCORD_SETUP.md` с подробными инструкциями
- Создан скрипт `check-discord-config.bat` для проверки конфигурации
- Добавлено логирование конфигурации OAuth

### 3. Улучшена функциональность приложения
- Добавлено сохранение состояния приложения в localStorage
- Добавлена автоматическая загрузка состояния при запуске
- Улучшена обработка ошибок соединения

## 🚀 Как исправить ошибку

### Шаг 1: Проверьте Discord Developer Portal
1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Выберите ваше приложение
3. Перейдите в раздел "OAuth2"

### Шаг 2: Настройте Redirect URLs
В разделе "Redirects" добавьте **ТОЧНО** эти URL:
```
http://localhost:3000/auth/discord/callback
http://127.0.0.1:3000/auth/discord/callback
```

### Шаг 3: Проверьте Scopes
Выберите следующие scopes:
- ✅ `identify`
- ✅ `email`
- ✅ `guilds`

### Шаг 4: Обновите config.env
```env
DISCORD_CLIENT_ID=ваш_реальный_client_id
DISCORD_CLIENT_SECRET=ваш_реальный_client_secret
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback
```

### Шаг 5: Перезапустите сервер
```bash
# Остановите сервер (Ctrl+C)
# Затем запустите заново
npm run dev
```

## 🧪 Тестирование

### Запустите проверку конфигурации
```bash
check-discord-config.bat
```

### Проверьте логи сервера
При запуске сервера должны появиться:
```
🔐 Configuring Discord OAuth strategy...
🔐 Client ID: ваш_client_id
🔐 Callback URL: http://localhost:3000/auth/discord/callback
✅ Discord OAuth strategy configured successfully
```

### Протестируйте аутентификацию
1. Откройте `http://localhost:5000`
2. Нажмите "Войти через Discord"
3. Авторизуйтесь через Discord
4. Должен произойти редирект обратно на приложение

## 📋 Частые ошибки и решения

### "Invalid redirect_uri"
- Проверьте, что callback URL в Discord Developer Portal точно совпадает с URL в config.env
- Убедитесь, что нет лишних слешей или пробелов

### "Invalid client"
- Проверьте Client ID и Client Secret
- Убедитесь, что они скопированы правильно

### "Invalid scope"
- Проверьте, что все необходимые scopes выбраны в Discord Developer Portal

## 🔍 Отладка

### Проверьте URL в браузере
При нажатии "Войти через Discord" URL должен быть:
```
https://discord.com/api/oauth2/authorize?client_id=ВАШ_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify%20email%20guilds
```

### Проверьте консоль сервера
При callback должны появиться:
```
🔐 OAuth callback received
🔐 Query parameters: { code: '...', state: '...' }
🔐 Session ID: ...
```

## 📞 Если проблема остается

1. **Создайте новое Discord Application**
2. **Используйте новые Client ID и Client Secret**
3. **Настройте OAuth2 с нуля**
4. **Проверьте, что Discord Developer Portal доступен**

## 📁 Файлы для проверки

- `DISCORD_SETUP.md` - подробные инструкции по настройке
- `check-discord-config.bat` - скрипт проверки конфигурации
- `config.env` - переменные окружения
- `server.js` - сервер с улучшенной обработкой ошибок

---

## ✅ После исправления

После успешного исправления:
1. ✅ Сервер запускается без ошибок
2. ✅ Discord OAuth работает корректно
3. ✅ Пользователи могут авторизоваться
4. ✅ Все функции приложения работают
5. ✅ Состояние приложения сохраняется

**Discord Tracker Pro готов к использованию!** 🎉
