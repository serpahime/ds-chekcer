# 🚀 Развертывание Discord Tracker Pro

## Вариант 1: Render.com (Бесплатно)

### 1. Подготовка
- Создайте аккаунт на [render.com](https://render.com)
- Подключите ваш GitHub репозиторий

### 2. Создание Web Service
1. Нажмите "New +" → "Web Service"
2. Выберите ваш репозиторий
3. Настройте:
   - **Name**: `discord-tracker-pro`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Port**: `3000`

### 3. Переменные окружения
Добавьте в Environment Variables:
```
NODE_ENV=production
PORT=3000
DISCORD_CLIENT_ID=ваш_discord_client_id
DISCORD_CLIENT_SECRET=ваш_discord_client_secret
MONGODB_URI=ваша_mongodb_uri
JWT_SECRET=ваш_jwt_secret
SESSION_SECRET=ваш_session_secret
```

### 4. Deploy
Нажмите "Create Web Service" и дождитесь деплоя.

## Вариант 2: Railway.app (Бесплатно)

### 1. Подготовка
- Зарегистрируйтесь на [railway.app](https://railway.app)
- Подключите GitHub

### 2. Создание проекта
1. Нажмите "New Project"
2. Выберите "Deploy from GitHub repo"
3. Выберите ваш репозиторий

### 3. Настройка
- Railway автоматически определит Node.js
- Добавьте переменные окружения
- Deploy произойдет автоматически

## Вариант 3: Docker + VPS

### 1. Подготовка VPS
```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установить Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Развертывание
```bash
# Клонировать репозиторий
git clone https://github.com/ваш_username/ваш_репозиторий.git
cd ваш_репозиторий

# Создать config.env
cp config.env.example config.env
# Отредактировать config.env с вашими данными

# Запустить
docker-compose up -d
```

## Вариант 4: PM2 + VPS

### 1. Установка PM2
```bash
npm install -g pm2
```

### 2. Развертывание
```bash
# Установить зависимости
npm install

# Запустить с PM2
pm2 start ecosystem.config.js

# Сохранить конфигурацию
pm2 save
pm2 startup
```

## 🔧 Настройка Discord OAuth

### 1. Discord Developer Portal
1. Перейдите на [Discord Developer Portal](https://discord.com/developers/applications)
2. Выберите ваше приложение
3. Перейдите в "OAuth2" → "General"

### 2. Redirect URIs
Добавьте URL для продакшена:
```
https://ваш-домен.com/auth/discord/callback
```

### 3. Обновить config.env
```
DISCORD_CALLBACK_URL=https://ваш-домен.com/auth/discord/callback
```

## 🌐 Домен и SSL

### 1. Домен
- Купите домен (например, на reg.ru, godaddy.com)
- Настройте DNS записи на ваш хостинг

### 2. SSL сертификат
- Render и Railway предоставляют SSL автоматически
- Для VPS используйте Let's Encrypt:
```bash
sudo apt install certbot
sudo certbot --nginx -d ваш-домен.com
```

## 📊 Мониторинг

### 1. PM2
```bash
pm2 monit
pm2 logs
```

### 2. Docker
```bash
docker-compose logs -f
docker stats
```

## 🚨 Безопасность

### 1. Переменные окружения
- Никогда не коммитьте config.env в Git
- Используйте разные секреты для продакшена

### 2. Firewall
```bash
# Настроить UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 📝 Проверка работоспособности

### 1. Health Check
```
GET https://ваш-домен.com/health
```

### 2. Основные эндпоинты
```
GET https://ваш-домен.com/
GET https://ваш-домен.com/auth/discord
```

## 🆘 Устранение неполадок

### 1. Логи
```bash
# PM2
pm2 logs discord-tracker-pro

# Docker
docker-compose logs app

# Render/Railway
# Проверьте логи в веб-интерфейсе
```

### 2. Частые проблемы
- **Port already in use**: Измените порт в config.env
- **MongoDB connection failed**: Проверьте MONGODB_URI
- **Discord OAuth error**: Проверьте callback URL

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Убедитесь, что все переменные окружения установлены
3. Проверьте настройки Discord OAuth
4. Создайте issue в GitHub репозитории
