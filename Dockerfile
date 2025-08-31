FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем папку для логов
RUN mkdir -p logs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
