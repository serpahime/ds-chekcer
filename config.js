// Discord Tracker Pro - Configuration
const CONFIG = {
  // API Configuration
  API: {
    BASE_URL: 'https://corsproxy.io/?https://fishonxd.su/api/checks/user',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
  },
  
  // Application Settings
  APP: {
    NAME: 'Discord Tracker Pro',
    VERSION: '1.0.0',
    DESCRIPTION: 'Анализ профилей Discord пользователей',
    AUTHOR: 'Discord Tracker Team',
  },
  
  // UI Configuration
  UI: {
    ANIMATION_DURATION: 300,
    NOTIFICATION_TIMEOUT: 5000,
    LOADING_DELAY: 1500,
    THEME: 'dark', // 'dark' or 'light'
  },
  
  // Validation Rules
  VALIDATION: {
    DISCORD_ID_PATTERN: /^\d{18,19}$/,
    MIN_USERNAME_LENGTH: 2,
    MAX_USERNAME_LENGTH: 32,
  },
  
  // Risk Assessment Configuration
  RISK: {
    FACTORS: {
      NEW_ACCOUNT: 30,        // Account less than 30 days old
      RECENT_ACCOUNT: 15,     // Account less than 90 days old
      YOUNG_ACCOUNT: 5,       // Account less than 1 year old
      INACTIVE_WEEK: 25,      // Inactive for more than a week
      INACTIVE_DAYS: 15,      // Inactive for more than 3 days
      LOW_MESSAGES: 20,       // Less than 100 messages
      NO_VOICE: 15,           // No voice activity
    },
    THRESHOLDS: {
      LOW: 30,                // Green - Low risk
      MEDIUM: 70,             // Yellow - Medium risk
      HIGH: 100,              // Red - High risk
    }
  },
  
  // Default Values
  DEFAULTS: {
    AVATAR: 'https://i.pravatar.cc/128?img=1',
    USERNAME: 'Неизвестно',
    BIO: 'Описание не указано',
    STATUS: 'offline',
  },
  
  // Error Messages
  ERRORS: {
    INVALID_DISCORD_ID: 'Неверный формат Discord ID. Используйте 18-19 цифр.',
    USER_NOT_FOUND: 'Пользователь не найден.',
    API_ERROR: 'Ошибка при обращении к API.',
    NETWORK_ERROR: 'Ошибка сети. Проверьте подключение к интернету.',
    TIMEOUT_ERROR: 'Превышено время ожидания ответа от сервера.',
  },
  
  // Success Messages
  SUCCESS: {
    PROFILE_LOADED: 'Профиль успешно загружен!',
    USER_TRACKED: 'Пользователь добавлен в отслеживание!',
    DATA_UPDATED: 'Данные обновлены!',
  },
  
  // Info Messages
  INFO: {
    SEARCH_BY_USERNAME: 'Поиск по имени пользователя пока не поддерживается. Используйте Discord ID.',
    LOADING_PROFILE: 'Загрузка профиля...',
    NO_DATA_AVAILABLE: 'Данные недоступны',
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  // Make available globally in browser
  window.CONFIG = CONFIG;
}
