# 🔧 Настройка Discord Application для исправления ошибки OAuth

## ❌ Проблема
Ошибка "Invalid \"code\" in request" возникает из-за неправильной настройки Discord Application.

## ✅ Решение

### 1. Проверьте Discord Developer Portal

1. **Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)**
2. **Выберите ваше приложение** (или создайте новое)
3. **Перейдите в раздел "OAuth2"**

### 2. Настройка OAuth2

#### Redirects (Обязательно!)
В разделе "Redirects" добавьте **ТОЧНО** эти URL:
```
http://localhost:3000/auth/discord/callback
http://127.0.0.1:3000/auth/discord/callback
```

#### Scopes
Выберите следующие scopes:
- ✅ `identify`
- ✅ `email` 
- ✅ `guilds`

### 3. Проверьте Client ID и Client Secret

1. **Скопируйте Client ID** из раздела "General Information"
2. **Скопируйте Client Secret** из раздела "OAuth2" (нажмите "Reset Secret" если нужно)
3. **Обновите config.env**:

```env
DISCORD_CLIENT_ID=ваш_реальный_client_id
DISCORD_CLIENT_SECRET=ваш_реальный_client_secret
DISCORD_CALLBACK_URL=http://localhost:3000/auth/discord/callback
```

### 4. Важные моменты

#### Callback URL должен быть точным
- ❌ `http://localhost:3000/auth/discord/callback/` (слеш в конце)
- ✅ `http://localhost:3000/auth/discord/callback` (без слеша)

#### Проверьте порты
- Бэкенд должен работать на порту **3000**
- Фронтенд должен работать на порту **5000**

### 5. Тестирование

1. **Остановите сервер** (Ctrl+C)
2. **Перезапустите сервер**:
   ```bash
   npm run dev
   ```
3. **Откройте браузер** и перейдите на `http://localhost:5000`
4. **Нажмите "Войти через Discord"**
5. **Проверьте консоль сервера** на наличие ошибок

### 6. Отладка

#### Проверьте логи сервера
```bash
# В консоли сервера должны появиться:
🔐 Configuring Discord OAuth strategy...
🔐 Client ID: ваш_client_id
🔐 Callback URL: http://localhost:3000/auth/discord/callback
✅ Discord OAuth strategy configured successfully
```

#### Проверьте URL в браузере
При нажатии "Войти через Discord" URL должен быть:
```
https://discord.com/api/oauth2/authorize?client_id=ВАШ_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord%2Fcallback&response_type=code&scope=identify%20email%20guilds
```

### 7. Частые ошибки

#### "Invalid redirect_uri"
- Проверьте, что callback URL в Discord Developer Portal точно совпадает с URL в config.env
- Убедитесь, что нет лишних слешей или пробелов

#### "Invalid client"
- Проверьте Client ID и Client Secret
- Убедитесь, что они скопированы правильно

#### "Invalid scope"
- Проверьте, что все необходимые scopes выбраны в Discord Developer Portal

### 8. Альтернативное решение

Если проблема не решается, попробуйте:

1. **Создать новое Discord Application**
2. **Использовать новые Client ID и Client Secret**
3. **Настроить OAuth2 с нуля**

### 9. Проверка работоспособности

После успешной настройки:
1. ✅ Сервер запускается без ошибок
2. ✅ В консоли появляется "Discord OAuth strategy configured successfully"
3. ✅ При нажатии "Войти через Discord" происходит редирект на Discord
4. ✅ После авторизации происходит редирект обратно на приложение
5. ✅ Пользователь видит свой профиль

---

## 🆘 Если проблема остается

1. **Проверьте все настройки еще раз**
2. **Убедитесь, что Discord Application активно**
3. **Попробуйте создать новое приложение**
4. **Проверьте, что нет конфликтов портов**

## 📞 Поддержка

Если ничего не помогает:
1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены правильно
3. Проверьте, что Discord Developer Portal доступен
