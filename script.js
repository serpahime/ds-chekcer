// Discord Tracker Pro - Main Application with Authentication
class DiscordTracker {
  constructor() {
    this.currentUser = null;
    this.isLoading = false;
    this.isAuthenticated = false;
    this.userProfile = null;
    this.trackingList = [];
    this.apiBaseUrl = 'https://ds-chekcer-1.onrender.com/api';
    this.currentNoteUserId = null;
    this.init();
    this.bindNoteModalEvents();
    this.checkServerHealth();
  }

  init() {
    // Load saved application state
    this.loadApplicationState();
    
    this.checkAuthStatus();
    this.bindEvents();
    this.setupAnimations();
    this.checkUrlParams();
    
    // Ensure proper initial state after auth check
    setTimeout(() => {
      this.ensureProperNavigationState();
    }, 500);
    
    // Check auth status every 5 minutes
    setInterval(() => {
      if (this.isAuthenticated) {
        this.checkAuthStatus();
      }
    }, 5 * 60 * 1000);
    
    // Refresh session every 10 minutes to keep it alive
    setInterval(() => {
      if (this.isAuthenticated) {
        this.refreshSession();
      }
    }, 10 * 60 * 1000);

    // Auto-refresh tracking data every 30 minutes
    setInterval(() => {
      if (this.isAuthenticated) {
        this.loadUserDashboard();
      }
    }, 30 * 60 * 1000);

    // Save application state every 5 minutes
    setInterval(() => {
      this.saveApplicationState();
    }, 5 * 60 * 1000);

    // Save state before page unload
    window.addEventListener('beforeunload', () => {
      this.saveApplicationState();
    });
  }

  bindEvents() {
    // Navigation menu events
    document.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const action = item.getAttribute('data-action');
        
        console.log(`🎯 Menu item clicked: ${action}`);
        console.log(`🎯 Element text: ${item.textContent.trim()}`);
        
        // Use centralized navigation handler
        this.navigateToSection(action);
      });
    });

    // Search functionality
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('discord-search');
    
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }
    
    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
      
      // Real-time validation
      searchInput.addEventListener('input', (e) => {
        this.validateSearchInput(e.target);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.navigateToSection('search');
      }
    });

    // Notification button
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', () => {
        this.showHighRiskUsers();
      });
    }

    // User dropdown
    const userProfile = document.getElementById('user-profile');
    if (userProfile) {
      userProfile.addEventListener('click', () => {
        const dropdown = document.getElementById('user-dropdown');
        dropdown.classList.toggle('show');
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('user-dropdown');
      if (dropdown && !e.target.closest('#user-profile')) {
        dropdown.classList.remove('show');
      }
    });


  }

  // Centralized navigation handler - fixes the button bug
  navigateToSection(section) {
    console.log(`🔄 Navigating to section: ${section}`);
    console.log(`🔄 Authentication status: ${this.isAuthenticated}`);
    
    try {
      // Always hide all sections first
      this.hideAllSections();
      
      // Update navigation tabs
      this.updateTabs(section);
      
      // Save current navigation state
      this.saveNavigationState(section);
      
      // Handle navigation based on authentication status
      if (!this.isAuthenticated) {
        // If not authenticated, show welcome screen for all sections except home
        if (section === 'home') {
          const welcomeScreen = document.getElementById('welcome-screen');
          if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
          } else {
            console.error('❌ Welcome screen element not found');
          }
        } else {
          const welcomeScreen = document.getElementById('welcome-screen');
          if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
          }
          this.showNotification('Пожалуйста, войдите в систему для доступа к этой функции', 'warning');
        }
        return;
      }
      
      // User is authenticated - show appropriate content
      switch (section) {
        case 'home':
          console.log('🏠 Home case executed');
          const homeDashboard = document.getElementById('home-dashboard');
          if (homeDashboard) {
            console.log('✅ Home dashboard element found, showing it');
            homeDashboard.style.display = 'block';
            this.loadHomeDashboard();
          } else {
            console.error('❌ Home dashboard element not found');
          }
          break;
          
        case 'search':
          const userDashboard = document.getElementById('user-dashboard');
          if (userDashboard) {
            userDashboard.style.display = 'block';
            this.loadUserDashboard();
            // Focus on search input after a short delay
            setTimeout(() => {
              const searchInput = document.getElementById('discord-search');
              if (searchInput) {
                searchInput.focus();
              }
            }, 100);
          } else {
            console.error('❌ User dashboard element not found');
          }
          break;
          
        case 'analytics':
          const analyticsDashboard = document.getElementById('user-dashboard');
          if (analyticsDashboard) {
            analyticsDashboard.style.display = 'block';
            this.loadUserDashboard();
          } else {
            console.error('❌ User dashboard element not found');
          }
          break;
          
        case 'tracking':
          const trackingManagement = document.getElementById('tracking-management');
          if (trackingManagement) {
            trackingManagement.style.display = 'block';
            this.loadTrackingList();
          } else {
            console.error('❌ Tracking management element not found');
          }
          break;
          
        case 'archive':
          const archiveDashboard = document.getElementById('user-dashboard');
          if (archiveDashboard) {
            archiveDashboard.style.display = 'block';
            this.loadUserDashboard();
            this.showNotification('Архив пользователей - в разработке', 'info');
          } else {
            console.error('❌ User dashboard element not found');
          }
          break;
          
        case 'servers':
          console.log('🔄 Navigating to servers section...');
          const serversPanel = document.getElementById('servers-panel');
          if (serversPanel) {
            console.log('✅ Servers panel found, showing it...');
            serversPanel.style.display = 'block';
            // Сразу загружаем данные серверов
            console.log('🔄 Loading servers data immediately...');
            this.loadServers();
          } else {
            console.error('❌ Servers panel element not found');
          }
          break;
          
        default:
          console.warn(`⚠️ Unknown section: ${section}, defaulting to home`);
          const defaultDashboard = document.getElementById('home-dashboard');
          if (defaultDashboard) {
            defaultDashboard.style.display = 'block';
            this.loadHomeDashboard();
          }
          break;
      }
      
      console.log(`✅ Successfully navigated to: ${section}`);
      
    } catch (error) {
      console.error('❌ Navigation error:', error);
      // Fallback to home
      this.navigateToSection('home');
    }
  }

  // Save current navigation state
  saveNavigationState(section) {
    try {
      const state = {
        currentSection: section,
        timestamp: Date.now()
      };
      localStorage.setItem('discordTracker_navigation', JSON.stringify(state));
    } catch (error) {
      console.warn('⚠️ Could not save navigation state:', error);
    }
  }

  // Load saved navigation state
  loadNavigationState() {
    try {
      const saved = localStorage.getItem('discordTracker_navigation');
      if (saved) {
        const state = JSON.parse(saved);
        // Only restore if the state is less than 1 hour old
        if (Date.now() - state.timestamp < 60 * 60 * 1000) {
          return state.currentSection;
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load navigation state:', error);
    }
    return 'home'; // Default to home
  }

  // Ensure proper navigation state on page load
  ensureProperNavigationState() {
    console.log('🔍 Ensuring proper navigation state...');
    
    // Check if any section is currently visible
    const sections = [
      'welcome-screen',
      'home-dashboard', 
      'user-dashboard',
      'profile-section',
      'dashboard',
      'tracking-management',
      'settings-panel',
      'servers-panel'
    ];
    
    let visibleSection = null;
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element && element.style.display !== 'none') {
        visibleSection = sectionId;
      }
    });
    
    // If no section is visible or multiple sections are visible, fix it
    if (!visibleSection || sections.filter(id => {
      const element = document.getElementById(id);
      return element && element.style.display !== 'none';
    }).length > 1) {
      console.log('⚠️ Navigation state inconsistent, fixing...');
      
      // Try to restore from saved state if authenticated
      if (this.isAuthenticated) {
        const savedSection = this.loadNavigationState();
        console.log(`🔄 Restoring saved navigation state: ${savedSection}`);
        this.navigateToSection(savedSection);
      } else {
        this.navigateToSection('home');
      }
    } else {
      console.log(`✅ Navigation state is consistent: ${visibleSection}`);
    }
  }

  // Load servers from API
  async loadServers() {
    console.log('🔄 Loading servers...');
    
    try {
      // Show loading state
      this.showServersLoading();
      
      // Fetch servers from API
      const response = await fetch('/api/proxy/guilds');
      
      if (response.ok) {
        const data = await response.json();
        console.log('DEBUG guilds API data:', data);
        // Поддержка разных структур ответа
        const servers = data.guilds || (data.data && data.data.guilds) || [];
        
        console.log(`✅ Loaded ${servers.length} servers from API`);
        
        // Update stats
        this.updateServersStats(servers);
        
        // Render top voice servers
        this.renderTopVoiceServers(servers);
        
        // Render all servers
        this.renderAllServers(servers);
        
        // Bind server events
        this.bindServerEvents();
        
      } else {
        console.error('❌ Failed to load servers from API, using demo data');
        // Если API недоступен, используем тестовые данные для демонстрации
        this.loadDemoServers();
      }
      
    } catch (error) {
      console.error('❌ Error loading servers from API, using demo data:', error);
      // Если API недоступен, используем тестовые данные для демонстрации
      this.loadDemoServers();
    }
  }

  // Load demo servers for testing/demo purposes
  loadDemoServers() {
    console.log('🔄 Loading demo servers...');
    
    const demoServers = [
      {
        id: '254958490676625408',
        name: 'Lounge',
        iconURL: null,
        memberCount: 516676,
        memberInVoice: 606,
        boosts: { tier: 3, count: 194 },
        description: 'Добро пожаловать на сервер Lounge - лучшее место для общения! Мы гордимся тем, что имеем самый активный и дружелюбный комьюнити.',
        invite: 'https://discord.gg/lounge'
      },
      {
        id: '123456789012345678',
        name: 'Gaming Hub',
        iconURL: null,
        memberCount: 125000,
        memberInVoice: 450,
        boosts: { tier: 2, count: 89 },
        description: 'Лучший игровой сервер для всех геймеров. Присоединяйтесь к нашему комьюнити!',
        invite: 'https://discord.gg/gaming'
      },
      {
        id: '987654321098765432',
        name: 'Music Studio',
        iconURL: null,
        memberCount: 89000,
        memberInVoice: 320,
        boosts: { tier: 1, count: 45 },
        description: 'Музыкальный сервер для всех любителей музыки. Делитесь своими треками!',
        invite: 'https://discord.gg/music'
      },
      {
        id: '555666777888999000',
        name: 'Tech Community',
        iconURL: null,
        memberCount: 75000,
        memberInVoice: 280,
        boosts: { tier: 0, count: 12 },
        description: 'Техническое сообщество для разработчиков и IT специалистов.',
        invite: 'https://discord.gg/tech'
      },
      {
        id: '111222333444555666',
        name: 'Art Gallery',
        iconURL: null,
        memberCount: 45000,
        memberInVoice: 180,
        boosts: { tier: 1, count: 23 },
        description: 'Галерея искусств для художников и ценителей прекрасного.',
        invite: 'https://discord.gg/art'
      },
      {
        id: '777888999000111222',
        name: 'Sports Club',
        iconURL: null,
        memberCount: 68000,
        memberInVoice: 220,
        boosts: { tier: 0, count: 8 },
        description: 'Спортивный клуб для всех любителей спорта и активного образа жизни.',
        invite: 'https://discord.gg/sports'
      }
    ];
    
    console.log(`✅ Loaded ${demoServers.length} demo servers`);
    
    // Update stats
    this.updateServersStats(demoServers);
    
    // Render top voice servers
    this.renderTopVoiceServers(demoServers);
    
    // Render all servers
    this.renderAllServers(demoServers);
    
    // Bind server events
    this.bindServerEvents();
  }

  // Show loading state for servers
  showServersLoading() {
    const topVoiceGrid = document.getElementById('top-voice-servers');
    const serversGrid = document.getElementById('servers-grid');
    
    if (topVoiceGrid) {
      topVoiceGrid.innerHTML = `
        <div class="servers-loading">
          <div class="spinner"></div>
        </div>
      `;
    }
    
    if (serversGrid) {
      serversGrid.innerHTML = `
        <div class="servers-loading">
          <div class="spinner"></div>
        </div>
      `;
    }
  }

  // Show error state for servers
  showServersError(message) {
    const topVoiceGrid = document.getElementById('top-voice-servers');
    const serversGrid = document.getElementById('servers-grid');
    
    const errorHTML = `
      <div class="servers-empty">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Ошибка загрузки</h3>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="window.discordTracker.loadServers()">
          <i class="fas fa-refresh"></i>
          Попробовать снова
        </button>
      </div>
    `;
    
    if (topVoiceGrid) {
      topVoiceGrid.innerHTML = errorHTML;
    }
    
    if (serversGrid) {
      serversGrid.innerHTML = errorHTML;
    }
  }

  // Update servers statistics
  updateServersStats(servers) {
    console.log('🔄 Updating servers stats with:', servers);
    
    const totalServers = document.getElementById('total-servers');
    const totalMembers = document.getElementById('total-members');
    const totalVoice = document.getElementById('total-voice');
    
    console.log('🔍 Found elements:', { totalServers, totalMembers, totalVoice });
    
    if (totalServers) {
      const serversCount = servers.length;
      console.log(`📊 Setting total servers to: ${serversCount}`);
      totalServers.textContent = serversCount.toLocaleString();
    } else {
      console.error('❌ total-servers element not found');
    }
    
    if (totalMembers) {
      const totalMembersCount = servers.reduce((sum, server) => sum + (server.memberCount || 0), 0);
      console.log(`📊 Setting total members to: ${totalMembersCount}`);
      totalMembers.textContent = totalMembersCount.toLocaleString();
    } else {
      console.error('❌ total-members element not found');
    }
    
    if (totalVoice) {
      const totalVoiceCount = servers.reduce((sum, server) => sum + (server.memberInVoice || 0), 0);
      console.log(`📊 Setting total voice to: ${totalVoiceCount}`);
      totalVoice.textContent = totalVoiceCount.toLocaleString();
    } else {
      console.error('❌ total-voice element not found');
    }
    
    console.log('✅ Servers stats updated successfully');
  }

  // Render top voice servers
  renderTopVoiceServers(servers) {
    const topVoiceGrid = document.getElementById('top-voice-servers');
    if (!topVoiceGrid) return;
    
    // Sort by voice members and take top 6
    const topVoiceServers = servers
      .filter(server => server.memberInVoice > 0)
      .sort((a, b) => b.memberInVoice - a.memberInVoice)
      .slice(0, 6);
    
    if (topVoiceServers.length === 0) {
      topVoiceGrid.innerHTML = `
        <div class="servers-empty">
          <i class="fas fa-microphone-slash"></i>
          <h3>Нет активных голосовых каналов</h3>
          <p>В данный момент нет серверов с активными голосовыми каналами</p>
        </div>
      `;
      return;
    }
    
    const serversHTML = topVoiceServers.map((server, index) => 
      this.createServerCardHTML(server, true, index + 1)
    ).join('');
    
    topVoiceGrid.innerHTML = serversHTML;
  }

  // Render all servers
  renderAllServers(servers) {
    const serversGrid = document.getElementById('servers-grid');
    if (!serversGrid) return;
    
    if (servers.length === 0) {
      serversGrid.innerHTML = `
        <div class="servers-empty">
          <i class="fas fa-server"></i>
          <h3>Серверы не найдены</h3>
          <p>Не удалось загрузить список серверов</p>
        </div>
      `;
      return;
    }
    
    const serversHTML = servers.map(server => 
      this.createServerCardHTML(server, false)
    ).join('');
    
    serversGrid.innerHTML = serversHTML;
  }

  // Create server card HTML
  createServerCardHTML(server, isTopVoice = false, rank = null) {
    const iconHTML = server.iconURL 
      ? `<img src="${server.iconURL}" alt="${server.name}" onerror="this.parentElement.classList.add('fallback'); this.parentElement.textContent='${server.name.charAt(0).toUpperCase()}'; this.remove();">`
      : `<span>${server.name.charAt(0).toUpperCase()}</span>`;
    
    const boostBadge = this.getBoostBadgeHTML(server.boosts);
    const rankBadge = rank ? `<div class="rank-badge">#${rank}</div>` : '';
    
    return `
      <div class="server-card ${isTopVoice ? 'top-voice' : ''}" data-server-id="${server.id}">
        ${rankBadge}
        <div class="server-header">
          <div class="server-icon ${!server.iconURL ? 'fallback' : ''}">
            ${iconHTML}
          </div>
          <div class="server-info">
            <h4>${this.escapeHtml(server.name)}</h4>
            <div class="server-id">${server.id}</div>
          </div>
        </div>
        
        <div class="server-stats">
          <div class="stat-item">
            <span class="stat-value">${server.memberCount?.toLocaleString() || '0'}</span>
            <div class="stat-label">Участников</div>
          </div>
          <div class="stat-item">
            <span class="stat-value">${server.memberInVoice?.toLocaleString() || '0'}</span>
            <div class="stat-label">В войсе</div>
          </div>
          <div class="stat-item">
            <span class="stat-value">${server.boosts?.count || '0'}</span>
            <div class="stat-label">Бустов</div>
          </div>
        </div>
        
        <div class="server-boosts">
          ${boostBadge}
        </div>
        
        ${server.description ? `
          <div class="server-description">
            ${this.escapeHtml(server.description)}
          </div>
        ` : ''}
        
        <div class="server-actions">
          ${server.invite ? `
            <button class="btn btn-primary" onclick="window.discordTracker.joinServer('${server.invite}')">
              <i class="fas fa-sign-in-alt"></i>
              Присоединиться
            </button>
          ` : ''}
          <button class="btn btn-outline" onclick="window.discordTracker.viewServerDetails('${server.id}')">
            <i class="fas fa-info-circle"></i>
            Подробнее
          </button>
        </div>
      </div>
    `;
  }

  // Get boost badge HTML
  getBoostBadgeHTML(boosts) {
    if (!boosts) return '';
    
    const tier = boosts.tier || 0;
    const count = boosts.count || 0;
    
    return `
      <span class="boost-badge tier-${tier}">
        Tier ${tier} (${count})
      </span>
    `;
  }

  // Escape HTML to prevent XSS
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Join server
  joinServer(inviteUrl) {
    window.open(inviteUrl, '_blank');
  }

  // View server details
  viewServerDetails(serverId) {
    this.showNotification(`Детали сервера ${serverId} - в разработке`, 'info');
  }

  // Bind server events
  bindServerEvents() {
    // Search functionality
    const searchInput = document.getElementById('servers-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterServers(e.target.value);
      });
    }
    
    // Sort functionality
    const sortSelect = document.getElementById('sort-servers');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortServers(e.target.value);
      });
    }
    
    // Boost filter
    const boostFilter = document.getElementById('boost-filter');
    if (boostFilter) {
      boostFilter.addEventListener('change', (e) => {
        this.filterByBoosts(e.target.value);
      });
    }
  }

  // Filter servers by search term
  filterServers(searchTerm) {
    const serverCards = document.querySelectorAll('.server-card');
    const term = searchTerm.toLowerCase();
    
    serverCards.forEach(card => {
      const serverName = card.querySelector('h4').textContent.toLowerCase();
      const serverId = card.querySelector('.server-id').textContent;
      
      if (serverName.includes(term) || serverId.includes(term)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  // Sort servers
  sortServers(sortBy) {
    // This would require re-rendering the servers with the new sort
    // For now, just show a notification
    this.showNotification(`Сортировка по ${sortBy} - в разработке`, 'info');
  }

  // Filter by boost level
  filterByBoosts(boostLevel) {
    const serverCards = document.querySelectorAll('.server-card');
    
    serverCards.forEach(card => {
      const boostBadge = card.querySelector('.boost-badge');
      if (!boostBadge) {
        card.style.display = boostLevel === '' ? 'block' : 'none';
        return;
      }
      
      const tier = boostBadge.textContent.match(/Tier (\d+)/)?.[1] || '0';
      
      if (boostLevel === '' || tier === boostLevel) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam && /^\d{18,19}$/.test(searchParam)) {
      // Wait for authentication check to complete
      setTimeout(() => {
        if (this.isAuthenticated) {
          const searchInput = document.getElementById('discord-search');
          if (searchInput) {
            searchInput.value = searchParam;
            this.performSearch();
          }
        }
      }, 1000);
    }
  }
  
  async refreshSession() {
    try {
      console.log('🔐 Refreshing session...');
      const response = await fetch(`${this.apiBaseUrl.replace('/api', '')}/api/session/status`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data.isAuthenticated) {
          console.log('✅ Session refreshed successfully');
        } else {
          console.log('❌ Session refresh failed, user not authenticated');
        }
      }
    } catch (error) {
      console.error('❌ Session refresh error:', error);
    }
  }

  async checkAuthStatus() {
    try {
      console.log('🔐 Checking authentication status...');
      
      // First check session status
      const sessionResponse = await fetch(`${this.apiBaseUrl.replace('/api', '')}/api/session/status`, {
        credentials: 'include'
      });
      
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        console.log('🔐 Session status:', sessionData.data);
        
        if (sessionData.data.isAuthenticated && sessionData.data.user) {
          console.log('✅ User authenticated via session check:', sessionData.data.user.username);
          this.isAuthenticated = true;
          
          // Get full user profile
          const profileResponse = await fetch(`${this.apiBaseUrl}/user/profile`, {
            credentials: 'include'
          });
          
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            if (profileData.success && profileData.user) {
              this.userProfile = profileData.user;
            } else {
              this.userProfile = sessionData.data.user;
            }
          } else {
            this.userProfile = sessionData.data.user;
          }
          
          this.showAuthenticatedUI();
          this.loadUserDashboard();
          return;
        }
      }
      
      // Fallback to profile check
      const response = await fetch(`${this.apiBaseUrl}/user/profile`, {
        credentials: 'include'
      });
      
      console.log('🔐 Auth check response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          console.log('✅ User authenticated:', data.user.username);
          this.isAuthenticated = true;
          this.userProfile = data.user;
          this.showAuthenticatedUI();
          this.loadUserDashboard();
        } else {
          console.log('❌ Auth response not successful:', data);
          this.showUnauthenticatedUI();
        }
      } else if (response.status === 401) {
        console.log('❌ User not authenticated (401)');
        this.showUnauthenticatedUI();
      } else {
        console.log('❌ Auth check failed with status:', response.status);
        this.showUnauthenticatedUI();
      }
    } catch (error) {
      console.error('❌ Error checking auth status:', error);
      this.showUnauthenticatedUI();
    }
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById('discord-search');
    const searchBtn = document.getElementById('search-btn');
    
    if (searchInput && searchBtn) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.performSearch();
        }
      });
      
      searchInput.addEventListener('input', (e) => {
        this.validateSearchInput(e.target);
      });
      
      searchBtn.addEventListener('click', () => {
        this.performSearch();
      });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Menu navigation - using centralized navigation system
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const action = item.getAttribute('data-action');
        this.navigateToSection(action);
      });
    });

    // Profile actions
    const trackBtn = document.getElementById('track-btn');
    if (trackBtn) {
      trackBtn.addEventListener('click', () => {
        this.trackUser();
      });
    }

    const noteBtn = document.getElementById('note-btn');
    if (noteBtn) {
      noteBtn.addEventListener('click', () => {
        if (this.currentUser) {
          this.openNoteModal(this.currentUser.discordId);
        }
      });
    }

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (this.currentUser) {
          this.refreshUserData(this.currentUser.discordId);
        }
      });
    }

    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (this.currentUser) {
          this.shareProfile(this.currentUser);
        }
      });
    }

    // Notification button
    const notificationBtn = document.getElementById('notification-btn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', () => {
        this.showHighRiskUsers();
      });
    }

    // Tracking search and filters
    const trackingSearch = document.getElementById('tracking-search');
    if (trackingSearch) {
      trackingSearch.addEventListener('input', (e) => {
        this.filterTrackingList(e.target.value);
      });
    }

    const priorityFilter = document.getElementById('priority-filter');
    if (priorityFilter) {
      priorityFilter.addEventListener('change', () => {
        this.applyTrackingFilters();
      });
    }

    const riskFilter = document.getElementById('risk-filter');
    if (riskFilter) {
      riskFilter.addEventListener('change', () => {
        this.applyTrackingFilters();
      });
    }

    // Profile dropdown logic
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    let dropdownTimeout;
    
    function showDropdown() {
      clearTimeout(dropdownTimeout);
      userDropdown.style.display = 'block';
    }
    function hideDropdown() {
      dropdownTimeout = setTimeout(() => {
        userDropdown.style.display = 'none';
      }, 150);
    }
    userProfile.addEventListener('mouseenter', showDropdown);
    userProfile.addEventListener('mouseleave', hideDropdown);
    userDropdown.addEventListener('mouseenter', showDropdown);
    userDropdown.addEventListener('mouseleave', hideDropdown);
  }

  setupAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    document.querySelectorAll('.stat-item, .activity-card, .dashboard-section').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  showUnauthenticatedUI() {
    // Show unauthenticated UI elements
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('user-profile').style.display = 'none';
    document.getElementById('notification-btn').style.display = 'none';
    
    // Reset authentication state
    this.isAuthenticated = false;
    this.userProfile = null;
    this.currentUser = null;
    this.trackingList = [];
    
    // Navigate to welcome screen
    this.navigateToSection('home');
  }

  showAuthenticatedUI() {
    // Show authenticated UI elements
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('user-profile').style.display = 'flex';
    document.getElementById('notification-btn').style.display = 'block';
    
    this.updateUserProfileDisplay();
    this.loadSettings();
    this.updateNotificationBadge();
    
    // Обновляем аватарку в header
    const userAvatarHeader = document.getElementById('user-avatar-header');
    if (userAvatarHeader) {
      if (this.userProfile && this.userProfile.avatar) {
        userAvatarHeader.src = `https://cdn.discordapp.com/avatars/${this.userProfile.discordId}/${this.userProfile.avatar}.png`;
      } else {
        userAvatarHeader.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }
    }
    
    // Try to restore saved navigation state, otherwise go to home
    const savedSection = this.loadNavigationState();
    console.log(`🔄 Restoring saved navigation state after authentication: ${savedSection}`);
    this.navigateToSection(savedSection);
  }

  updateUserProfileDisplay() {
    if (!this.userProfile) return;
    
    const userName = document.getElementById('user-name');
    
    if (userName) {
      userName.textContent = this.userProfile.username;
    }
  }

  async loadUserDashboard() {
    try {
      // Load tracking overview
      const trackingResponse = await fetch(`${this.apiBaseUrl}/user/tracking`, {
        credentials: 'include'
      });
      
      if (trackingResponse.ok) {
        const trackingData = await trackingResponse.json();
        this.trackingList = trackingData.tracking || [];
        this.updateTrackingOverview();
        
        // Update track button if we're viewing a user profile
        if (this.currentUser) {
          this.updateTrackButton(this.currentUser);
        }
        
        // Update notification badge
        this.updateNotificationBadge();
      } else {
        console.warn('Failed to load tracking data');
        this.trackingList = [];
        this.updateTrackingOverview();
      }

      // Load analytics
      const analyticsResponse = await fetch(`${this.apiBaseUrl}/analytics/overview`, {
        credentials: 'include'
      });
      
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        this.updateAnalyticsOverview(analyticsData.data);
      } else {
        console.warn('Failed to load analytics data');
      }

      // Load user profile info
      this.updateUserProfileInfo();
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  updateTrackingOverview() {
    const trackingOverview = document.getElementById('tracking-overview');
    if (!trackingOverview) return;

    const totalTracked = this.trackingList.length;
    const highRiskUsers = this.trackingList.filter(user => 
      user.riskScore && user.riskScore >= 70
    ).length;

    trackingOverview.innerHTML = `
      <div class="tracking-stat-card">
        <div class="tracking-stat-number">${totalTracked}</div>
        <div class="tracking-stat-label">Отслеживаемых пользователей</div>
      </div>
      <div class="tracking-stat-card">
        <div class="tracking-stat-number">${highRiskUsers}</div>
        <div class="tracking-stat-label">Высокий риск</div>
      </div>
      <div class="tracking-stat-card">
        <div class="tracking-stat-number">${this.userProfile.searchHistory ? this.userProfile.searchHistory.length : 0}</div>
        <div class="tracking-stat-label">Поисковых запросов</div>
      </div>
    `;
  }

  updateAnalyticsOverview(data) {
    const recentActivity = document.getElementById('recent-activity');
    if (!recentActivity) return;

    // Use recent searches from user profile if available
    const recentSearches = this.userProfile.searchHistory ? 
      this.userProfile.searchHistory.slice(-5).reverse() : 
      (data.recentSearches || []);

    if (recentSearches.length === 0) {
      recentActivity.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>Нет недавней активности</h3>
          <p>Начните искать пользователей, чтобы видеть историю здесь</p>
        </div>
      `;
      return;
    }

    recentActivity.innerHTML = recentSearches.map(search => {
      return `
        <div class="activity-item">
          <div class="activity-icon">
            <i class="fas fa-search"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">Поиск пользователя</div>
            <div class="activity-time">ID: ${search.query} - ${this.formatDate(search.timestamp)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateUserProfileInfo() {
    const userProfileInfo = document.getElementById('user-profile-info');
    if (!userProfileInfo || !this.userProfile) return;

    userProfileInfo.innerHTML = `
      <div class="profile-info-card">
        <h4>Основная информация</h4>
        <div class="profile-info-item">
          <span class="profile-info-label">Discord ID</span>
          <span class="profile-info-value">${this.userProfile.discordId}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Имя пользователя</span>
          <span class="profile-info-value">${this.userProfile.username}#${this.userProfile.discriminator}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Дата регистрации</span>
          <span class="profile-info-value">${this.formatDate(this.userProfile.createdAt)}</span>
        </div>
      </div>
      
      <div class="profile-info-card">
        <h4>Настройки</h4>
        <div class="profile-info-item">
          <span class="profile-info-label">Тема</span>
          <span class="profile-info-value">${this.userProfile.preferences?.theme || 'dark'}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Уведомления</span>
          <span class="profile-info-value">${this.userProfile.preferences?.notifications ? 'Включены' : 'Отключены'}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Язык</span>
          <span class="profile-info-value">${this.userProfile.preferences?.language || 'ru'}</span>
        </div>
      </div>
      
      <div class="profile-info-card">
        <h4>Статистика</h4>
        <div class="profile-info-item">
          <span class="profile-info-label">Отслеживаемых пользователей</span>
          <span class="profile-info-value">${this.trackingList.length}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Поисковых запросов</span>
          <span class="profile-info-value">${this.userProfile.searchHistory ? this.userProfile.searchHistory.length : 0}</span>
        </div>
        <div class="profile-info-item">
          <span class="profile-info-label">Последний вход</span>
          <span class="profile-info-value">${this.formatDate(this.userProfile.lastLogin)}</span>
        </div>
      </div>
    `;
  }

  async performSearch() {
    // Check authentication status first
    if (!this.isAuthenticated) {
      console.log('🔐 User not authenticated, redirecting to Discord login');
      this.showNotification('Войдите через Discord для поиска пользователей', 'warning');
      
      // Redirect to Discord OAuth after a short delay
      setTimeout(() => {
        window.location.href = 'https://ds-chekcer-1.onrender.com/auth/discord';
      }, 2000);
      return;
    }

    const searchInput = document.getElementById('discord-search');
    const query = searchInput.value.trim();
    
    if (!query) {
      this.showNotification('Введите Discord ID для поиска', 'warning');
      return;
    }

    if (!/^\d{18,19}$/.test(query)) {
      this.showNotification('Неверный формат Discord ID. Используйте 18-19 цифр.', 'warning');
      return;
    }

    this.setLoading(true);
    
    try {
      console.log('🔍 Performing search for Discord ID:', query);
      const response = await fetch(`${this.apiBaseUrl}/search/${query}`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        console.log('❌ Authentication expired, checking session status...');
        
        // Check session status before deciding to logout
        try {
          const sessionResponse = await fetch(`${this.apiBaseUrl.replace('/api', '')}/api/session/status`, {
            credentials: 'include'
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            console.log('🔐 Session status after 401:', sessionData.data);
            
            if (sessionData.data.isAuthenticated && sessionData.data.user) {
              console.log('✅ Session is still valid, retrying search...');
              // Retry the search once
              const retryResponse = await fetch(`${this.apiBaseUrl}/search/${query}`, {
                credentials: 'include'
              });
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.success) {
                  this.displayUserProfile(retryData.data.user);
                  this.showNotification('Профиль успешно загружен!', 'success');
                  return;
                }
              }
            }
          }
        } catch (sessionError) {
          console.log('❌ Session check failed:', sessionError);
        }
        
        // If we get here, authentication is truly expired
        console.log('❌ Authentication truly expired, redirecting to login');
        this.isAuthenticated = false;
        this.showUnauthenticatedUI();
        this.showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'warning');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.displayUserProfile(data.data.user);
          this.showNotification('Профиль успешно загружен!', 'success');
        } else {
          this.showNotification(data.error || 'Пользователь не найден', 'error');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при поиске пользователя', 'error');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.handleConnectionError(error);
    } finally {
      this.setLoading(false);
    }
  }

  displayUserProfile(userData) {
    this.currentUser = userData;
    
    document.getElementById('profile-section').style.display = 'block';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('user-dashboard').style.display = 'none';

    this.updateProfileInfo(userData);
    this.updateQuickStats(userData);
    this.updateRiskAssessment(userData);
    this.updateTabs('search');
    this.updateTrackButton(userData);
    this.updateProfileStatus(userData);
    
    this.triggerProfileAnimations();
    // --- Новая система репутации ---
    this.fetchAndDisplayReputation(userData.discordId);
    this.bindReputationEvents();
    // --- Система просмотров ---
    this.fetchAndDisplayViews(userData.discordId);
    this.autoAddView(userData.discordId);
  }

  updateProfileInfo(userData) {
    // Update avatar in profile section
    const userAvatarProfile = document.getElementById('user-avatar-profile');
    if (userAvatarProfile) {
      if (userData && userData.avatar) {
        userAvatarProfile.src = userData.avatar;
      } else {
        userAvatarProfile.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
      }
    }
    
    const username = document.getElementById('username');
    if (username) {
      username.textContent = userData.displayName || userData.username || 'Неизвестно';
    }
    
    const userTag = document.getElementById('user-tag');
    if (userTag) {
      userTag.textContent = `#${userData.discordId ? userData.discordId.slice(-4) : '0000'}`;
    }
    
    const userBio = document.getElementById('user-bio');
    if (userBio) {
      userBio.textContent = userData.bio || 'Описание не указано';
    }
    
    const badgesContainer = document.getElementById('user-badges');
    if (badgesContainer) {
      badgesContainer.innerHTML = '';
      
      if (userData.nitro) {
        const nitroBadge = document.createElement('span');
        nitroBadge.textContent = 'Nitro';
        nitroBadge.style.background = 'var(--gradient-accent)';
        badgesContainer.appendChild(nitroBadge);
      }
      
      if (userData.clan && userData.clan.tag) {
        const clanBadge = document.createElement('span');
        clanBadge.textContent = userData.clan.tag;
        clanBadge.style.background = 'var(--gradient-secondary)';
        badgesContainer.appendChild(clanBadge);
      }
      
      if (userData.badges && userData.badges.length > 0) {
        userData.badges.forEach(badge => {
          const badgeEl = document.createElement('span');
          badgeEl.textContent = badge;
          badgesContainer.appendChild(badgeEl);
        });
      }
    }

    const statusIndicator = document.querySelector('.status-indicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${userData.status || 'offline'}`;
    }
  }

  updateQuickStats(userData) {
    const viewsElement = document.getElementById('profile-views-count');
    if (viewsElement) {
      viewsElement.textContent = userData.activity?.views || 0;
    }
    
    const accountAgeElement = document.getElementById('account-age');
    if (accountAgeElement && userData.createdAt) {
      const createdAt = new Date(userData.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      accountAgeElement.textContent = daysDiff;
    }
    
    const voiceTimeElement = document.getElementById('voice-time');
    if (voiceTimeElement) {
      voiceTimeElement.textContent = userData.activity?.voiceTime || '0ч';
    }
    
    const messageCountElement = document.getElementById('message-count');
    if (messageCountElement) {
      messageCountElement.textContent = userData.activity?.messageCount || 0;
    }
  }

  updateRiskAssessment(userData) {
    const riskFill = document.getElementById('risk-fill');
    const riskScore = document.getElementById('risk-score');
    const riskScoreDisplay = document.getElementById('risk-score-display');
    
    if (riskFill && riskScore) {
      let riskScoreValue = userData.riskAssessment?.score || 0;
      
      if (riskScoreValue === 0) {
        // Calculate risk score if not available
        if (userData.createdAt) {
          const createdAt = new Date(userData.createdAt);
          const now = new Date();
          const daysDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
          
          if (daysDiff < 30) riskScoreValue += 30;
          else if (daysDiff < 90) riskScoreValue += 15;
          else if (daysDiff < 365) riskScoreValue += 5;
        }
        
        if (userData.lastSeen) {
          const lastSeen = new Date(userData.lastSeen);
          const now = new Date();
          const hoursDiff = Math.floor((now - lastSeen) / (1000 * 60 * 60));
          
          if (hoursDiff > 168) riskScoreValue += 25;
          else if (hoursDiff > 72) riskScoreValue += 15;
        }
        
        if (userData.activity?.messageCount && userData.activity.messageCount < 100) {
          riskScoreValue += 20;
        }
        
        if (userData.activity?.voiceTime && userData.activity.voiceTime === '0ч') {
          riskScoreValue += 15;
        }
        
        riskScoreValue = Math.min(riskScoreValue, 100);
      }
      
      // Update risk score display
      riskScore.textContent = riskScoreValue;
      if (riskScoreDisplay) {
        riskScoreDisplay.textContent = riskScoreValue;
      }
      
      // Update risk fill bar
      riskFill.style.width = `${riskScoreValue}%`;
      
      // Update risk level class
      riskFill.className = 'risk-fill';
      if (riskScoreValue >= 70) {
        riskFill.classList.add('high');
      } else if (riskScoreValue >= 30) {
        riskFill.classList.add('medium');
      }
    }
  }

  updateProfileStatus(userData) {
    const statusIndicator = document.getElementById('profile-status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'profile-status-indicator';
      const status = userData.status || 'offline';
      statusIndicator.classList.add(status);
    }
  }

  updateTabs(userData) {
    // Update names timeline
    const namesTimeline = document.getElementById('names-timeline');
    if (namesTimeline) {
      namesTimeline.innerHTML = '';
      
      if (userData.history?.usernames && userData.history.usernames.length > 0) {
        userData.history.usernames.forEach(nameData => {
          const nameItem = document.createElement('div');
          nameItem.className = 'timeline-item';
          nameItem.innerHTML = `
            <div class="timeline-date">${this.formatDate(nameData.changedAt)}</div>
            <div class="timeline-content">${nameData.username}</div>
          `;
          namesTimeline.appendChild(nameItem);
        });
      } else {
        const currentNameItem = document.createElement('div');
        currentNameItem.className = 'timeline-item';
        currentNameItem.innerHTML = `
          <div class="timeline-date">Сейчас</div>
          <div class="timeline-content">${userData.displayName || userData.username}</div>
        `;
        namesTimeline.appendChild(currentNameItem);
      }
    }

    // Update avatars grid
    const avatarsGrid = document.getElementById('avatars-grid');
    if (avatarsGrid) {
      avatarsGrid.innerHTML = '';
      
      if (userData.history?.avatars && userData.history.avatars.length > 0) {
        userData.history.avatars.forEach(avatarData => {
          const avatarItem = document.createElement('div');
          avatarItem.className = 'avatar-item';
          avatarItem.innerHTML = `
            <img src="${avatarData.url}" alt="Avatar">
            <span class="avatar-date">${this.formatDate(avatarData.changedAt)}</span>
          `;
          avatarsGrid.appendChild(avatarItem);
        });
      } else if (userData.avatar) {
        const avatarItem = document.createElement('div');
        avatarItem.className = 'avatar-item';
        avatarItem.innerHTML = `
          <img src="${userData.avatar}" alt="Current Avatar">
          <span class="avatar-date">Текущий</span>
        `;
        avatarsGrid.appendChild(avatarItem);
      }
    }

    // Update server list
    const serverList = document.getElementById('server-list');
    if (serverList) {
      serverList.innerHTML = '';
      
      if (userData.servers && userData.servers.length > 0) {
        userData.servers.forEach(server => {
          const serverItem = document.createElement('div');
          serverItem.className = 'server-item';
          serverItem.innerHTML = `
            <div class="server-icon">${server.name ? server.name.charAt(0).toUpperCase() : 'S'}</div>
            <div class="server-info">
              <span class="server-name">${server.name}</span>
              <span class="server-activity">Активен ${this.formatDate(server.lastActive)}</span>
            </div>
          `;
          serverList.appendChild(serverItem);
        });
      } else if (userData.clan && userData.clan.name) {
        const clanServerItem = document.createElement('div');
        clanServerItem.className = 'server-item';
        clanServerItem.innerHTML = `
          <div class="server-icon">${userData.clan.tag || 'CL'}</div>
          <div class="server-info">
            <span class="server-name">${userData.clan.name}</span>
            <span class="server-activity">Клан</span>
          </div>
        `;
        serverList.appendChild(clanServerItem);
      } else {
        const noServerItem = document.createElement('div');
        noServerItem.className = 'empty-state';
        noServerItem.innerHTML = `
          <i class="fas fa-server"></i>
          <h3>Нет данных о серверах</h3>
          <p>Информация о серверах недоступна</p>
        `;
        serverList.appendChild(noServerItem);
      }
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    this.animateTabContent(tabName);
  }

  animateTabContent(tabName) {
    const activePanel = document.getElementById(tabName);
    const elements = activePanel.querySelectorAll('.activity-card, .stat-card, .timeline-item, .avatar-item');
    
    elements.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }



  async trackUser() {
    if (!this.currentUser || !this.isAuthenticated) return;
    const discordId = this.currentUser.discordId;
    if (!discordId || !/^\d{18,19}$/.test(discordId)) {
      this.showNotification('Некорректный Discord ID для отслеживания', 'error');
      return;
    }
    
    // Check if user is already being tracked
    const isAlreadyTracked = this.trackingList.some(user => user.userId === discordId);
    if (isAlreadyTracked) {
      this.showNotification('Пользователь уже отслеживается', 'warning');
      return;
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          discordId: discordId,
          username: this.currentUser.username || this.currentUser.displayName,
          avatar: this.currentUser.avatar,
          notes: '',
          priority: 'medium'
        })
      });
      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.message || 'Пользователь добавлен в отслеживание!', 'success');
        // Reload tracking list to update the trackingList array
        await this.loadUserDashboard();
        this.updateTrackButton(this.currentUser);
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при добавлении в отслеживание', 'error');
        console.error('Track error:', errorData);
      }
    } catch (error) {
      console.error('Track error:', error);
      this.handleConnectionError(error);
    }
  }

  showDashboard() {
    this.navigateToSection('home');
  }

  showHome() {
    this.navigateToSection('home');
  }

  hideAllSections() {
    console.log('🙈 Hiding all sections...');
    // Hide all main content sections
    const sections = [
      'welcome-screen',
      'home-dashboard', 
      'user-dashboard',
      'profile-section',
      'dashboard',
      'tracking-management',
      'settings-panel',
      'servers-panel'
    ];
    
    sections.forEach(sectionId => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.style.display = 'none';
        console.log(`🙈 Hidden: ${sectionId}`);
      } else {
        console.warn(`⚠️ Section not found: ${sectionId}`);
      }
    });
  }

  updateTabs(section) {
    // Update navigation menu active state
    document.querySelectorAll('.menu-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = document.querySelector(`[data-action="${section}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
      console.log(`✅ Updated active tab to: ${section}`);
    } else {
      console.warn(`⚠️ Could not find menu item with data-action="${section}"`);
    }
  }

  async loadHomeDashboard() {
    console.log('🏠 Loading home dashboard...');
    try {
      // Load user stats
      await this.loadUserStats();
      
      // Load recent activity
      await this.loadRecentActivity();
      
      // Check system status
      await this.checkSystemStatus();
      
      // Start floating animation
      this.startFloatingAnimation();
      
      console.log('✅ Home dashboard loaded successfully');
    } catch (error) {
      console.error('❌ Error loading home dashboard:', error);
      this.handleConnectionError(error);
    }
  }

  async loadUserStats() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/overview`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const stats = data.data;
        
        // Update hero stats
        document.getElementById('total-users').textContent = stats.trackingCount || 0;
        document.getElementById('total-searches').textContent = stats.recentSearches?.length || 0;
        
        // Calculate high risk users
        const highRiskCount = this.trackingList?.filter(user => user.riskScore > 7).length || 0;
        document.getElementById('high-risk-users').textContent = highRiskCount;
        
        // Update tracking count in quick actions
        document.getElementById('tracking-count').textContent = stats.trackingCount || 0;
        
      } else {
        console.error('Failed to load user stats');
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/analytics/overview`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const recentSearches = data.data.recentSearches || [];
        
        const timeline = document.getElementById('activity-timeline');
        if (!timeline) return;
        
        let timelineHTML = '';
        
        if (recentSearches.length > 0) {
          recentSearches.slice(0, 5).forEach(search => {
            const time = new Date(search.timestamp).toLocaleString('ru-RU');
            timelineHTML += `
              <div class="timeline-item">
                <div class="timeline-icon">
                  <i class="fas fa-search"></i>
                </div>
                <div class="timeline-content">
                  <h4>Поиск пользователя</h4>
                  <p>ID: ${search.query}</p>
                  <span class="timeline-time">${time}</span>
                </div>
              </div>
            `;
          });
        } else {
          timelineHTML = `
            <div class="timeline-item">
              <div class="timeline-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="timeline-content">
                <h4>Добро пожаловать!</h4>
                <p>Начните работу с поиска пользователей</p>
                <span class="timeline-time">Сейчас</span>
              </div>
            </div>
          `;
        }
        
        timeline.innerHTML = timelineHTML;
        
      } else {
        console.error('Failed to load recent activity');
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  async checkSystemStatus() {
    try {
      // Check server health
      const healthResponse = await fetch(`${this.apiBaseUrl}/health`);
      const serverStatus = healthResponse.ok ? 'online' : 'offline';
      const serverText = healthResponse.ok ? 'Работает' : 'Недоступен';
      
      this.updateStatusCard('server-status', serverStatus, serverText);
      
      // Check database status
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        const dbStatus = healthData.mongodb === 'connected' ? 'online' : 'offline';
        const dbText = healthData.mongodb === 'connected' ? 'Подключена' : 'Ошибка подключения';
        
        this.updateStatusCard('database-status', dbStatus, dbText);
      } else {
        this.updateStatusCard('database-status', 'offline', 'Недоступна');
      }
      
      // Check Discord API (simulated)
      this.updateStatusCard('discord-status', 'online', 'Доступен');
      
    } catch (error) {
      console.error('Error checking system status:', error);
      this.updateStatusCard('server-status', 'offline', 'Ошибка проверки');
      this.updateStatusCard('database-status', 'offline', 'Ошибка проверки');
      this.updateStatusCard('discord-status', 'offline', 'Ошибка проверки');
    }
  }

  updateStatusCard(cardId, status, text) {
    const card = document.getElementById(cardId);
    if (!card) return;
    
    const statusText = card.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = text;
      statusText.className = `status-text ${status}`;
    }
  }

  startFloatingAnimation() {
    // Add animation classes to floating cards
    const cards = document.querySelectorAll('.floating-card');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 2}s`;
    });
  }

  showSearch() {
    this.navigateToSection('search');
  }

  showAnalytics() {
    this.navigateToSection('analytics');
  }

  showArchive() {
    this.navigateToSection('archive');
  }

  showServers() {
    this.navigateToSection('servers');
  }

  showTracking() {
    this.navigateToSection('tracking');
  }

  showSettings() {
    document.getElementById('user-dashboard').style.display = 'none';
    document.getElementById('tracking-management').style.display = 'none';
    document.getElementById('settings-panel').style.display = 'block';
    document.getElementById('profile-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    this.loadSettings();
  }

  async loadTrackingList() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/tracking`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        this.trackingList = data.tracking || [];
        console.log('[DEBUG] trackingList:', this.trackingList);
        
        // Load complete user data for all tracked users
        await this.loadCompleteUserDataForTracking();
        
        // Update track button if we have a current user
        if (this.currentUser) {
          this.updateTrackButton(this.currentUser);
        }
        this.renderTrackingList(this.trackingList);
      } else {
        console.error('Failed to load tracking list');
        this.trackingList = [];
        this.renderTrackingList([]);
      }
    } catch (error) {
      console.error('Error loading tracking list:', error);
      this.trackingList = [];
      this.renderTrackingList([]);
    }
  }

  renderTrackingList(list) {
    const trackingList = document.getElementById('tracking-list');
    if (!trackingList) {
      console.warn('[DEBUG] tracking-list element not found in DOM');
      return;
    }
    list = list || [];
    console.log('[DEBUG] renderTrackingList called, users:', list);
    
    if (list.length === 0) {
      // Show empty state
      const emptyState = document.getElementById('tracking-empty-state');
      const exampleCard = trackingList.querySelector('.tracked-user-card');
      
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      if (exampleCard) {
        exampleCard.style.display = 'none';
      }
      return;
    }
    
    // Hide empty state and show cards
    const emptyState = document.getElementById('tracking-empty-state');
    if (emptyState) {
      emptyState.style.display = 'none';
    }
    
    // Remove example card if it exists
    const exampleCard = trackingList.querySelector('.tracked-user-card');
    if (exampleCard) {
      exampleCard.remove();
    }
    
    trackingList.innerHTML = list.map(user => {
      console.log('[DEBUG] Rendering user in tracking list:', user);
      
      // Get proper avatar URL
      let avatar = 'https://cdn.discordapp.com/embed/avatars/0.png';
      if (user.displayAvatarURL) {
        avatar = user.displayAvatarURL;
      } else if (user.avatar) {
        if (user.avatar.startsWith('http')) {
          avatar = user.avatar;
        } else {
          avatar = `https://cdn.discordapp.com/avatars/${user.userId}/${user.avatar}.png`;
        }
      }
      
      const name = user.username || user.displayName || user.globalName || 'Unknown User';
      const tag = user.discriminator ? `#${user.discriminator}` : `#${user.userId.slice(-4)}`;
      const added = user.addedAt ? new Date(user.addedAt).toLocaleDateString('ru-RU') : '';
      const priority = user.priority || 'medium';
      const risk = user.riskScore !== undefined ? user.riskScore : 0;
      const status = user.status || 'offline';
      
      console.log('[DEBUG] Processed user data:', { name, avatar, tag, status });
      
      // Determine risk class
      let riskClass = 'low-risk';
      if (risk >= 70) riskClass = 'high-risk';
      else if (risk >= 30) riskClass = 'medium-risk';
      
      return `
        <div class="tracked-user-card ${riskClass}">
          <div class="tracked-user-header">
            <div class="tracked-user-avatar-container">
              <img src="${avatar}" alt="User Avatar" class="tracked-user-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
              <div class="tracked-user-status ${status}"></div>
            </div>
            <div class="tracked-user-info">
              <div class="tracked-user-name">${name}</div>
              <div class="tracked-user-tag">${tag}</div>
              <div class="tracked-user-id">${user.userId}</div>
            </div>
          </div>
          
          <div class="tracked-user-meta">
            <span class="meta-item"><i class="fas fa-calendar"></i> Добавлен: ${added}</span>
            <span class="priority-badge ${priority}">${priority}</span>
            <span class="risk-badge">Риск: ${risk}</span>
          </div>
          
          <div class="tracked-user-stats">
            <div class="tracked-stat-item">
              <i class="fas fa-eye"></i>
              <span class="tracked-stat-label">Просмотры:</span>
              <span class="tracked-stat-value">${user.activity?.views || 0}</span>
            </div>
            <div class="tracked-stat-item">
              <i class="fas fa-clock"></i>
              <span class="tracked-stat-label">Дней:</span>
              <span class="tracked-stat-value">${user.accountAge || 0}</span>
            </div>
            <div class="tracked-stat-item">
              <i class="fas fa-microphone"></i>
              <span class="tracked-stat-label">Голос:</span>
              <span class="tracked-stat-value">${user.activity?.voiceTime || '0ч'}</span>
            </div>
            <div class="tracked-stat-item">
              <i class="fas fa-comment"></i>
              <span class="tracked-stat-label">Сообщения:</span>
              <span class="tracked-stat-value">${user.messageCount || user.activity?.messageCount || 0}</span>
            </div>
          </div>
          
          <div class="tracked-user-actions">
            <button class="btn-view-profile" onclick="window.discordTracker.viewUserProfile('${user.userId}')">
              <i class="fas fa-user"></i>
              Профиль
            </button>
            <button class="btn-edit-note" onclick="window.discordTracker.openNoteModal('${user.userId}')">
              <i class="fas fa-edit"></i>
              Заметка
            </button>
            <button class="btn-remove-tracking" onclick="window.discordTracker.removeFromTracking('${user.userId}')">
              <i class="fas fa-trash"></i>
              Убрать
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterTrackingList(query) {
    const filteredList = this.trackingList.filter(user => 
      (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
      (user.displayName && user.displayName.toLowerCase().includes(query.toLowerCase())) ||
      (user.userId && user.userId.includes(query))
    );
    
    this.renderTrackingList(filteredList);
  }

  applyTrackingFilters() {
    const priorityFilter = document.getElementById('priority-filter').value;
    const riskFilter = document.getElementById('risk-filter').value;
    
    let filteredList = this.trackingList;
    
    if (priorityFilter) {
      filteredList = filteredList.filter(user => 
        user.priority === priorityFilter
      );
    }
    
    if (riskFilter) {
      filteredList = filteredList.filter(user => {
        const score = user.riskScore || 0;
        
        if (riskFilter === 'low') return score < 30;
        if (riskFilter === 'medium') return score >= 30 && score < 70;
        if (riskFilter === 'high') return score >= 70;
        
        return true;
      });
    }
    
    this.renderTrackingList(filteredList);
  }



  loadSettings() {
    if (!this.userProfile) return;
    
    const themeSelect = document.getElementById('theme-select');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const languageSelect = document.getElementById('language-select');
    
    if (themeSelect) {
      themeSelect.value = this.userProfile.preferences?.theme || 'dark';
    }
    
    if (notificationsToggle) {
      notificationsToggle.checked = this.userProfile.preferences?.notifications !== false;
    }
    
    if (languageSelect) {
      languageSelect.value = this.userProfile.preferences?.language || 'ru';
    }
    
    // Apply current theme
    if (this.userProfile.preferences?.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  async saveSettings() {
    try {
      const themeSelect = document.getElementById('theme-select');
      const notificationsToggle = document.getElementById('notifications-toggle');
      const languageSelect = document.getElementById('language-select');
      
      if (!themeSelect || !notificationsToggle || !languageSelect) {
        this.showNotification('Ошибка: элементы настроек не найдены', 'error');
        return;
      }
      
      const settings = {
        theme: themeSelect.value,
        notifications: notificationsToggle.checked,
        language: languageSelect.value
      };
      
      const response = await fetch(`${this.apiBaseUrl}/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showNotification('Настройки сохранены!', 'success');
        
        // Update user profile
        if (this.userProfile) {
          this.userProfile.preferences = data.preferences;
        }
        
        // Apply theme
        if (settings.theme === 'light') {
          document.body.classList.add('light-theme');
        } else {
          document.body.classList.remove('light-theme');
        }
        
        // Update user profile info display
        this.updateUserProfileInfo();
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при сохранении настроек', 'error');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      this.handleConnectionError(error);
    }
  }



  triggerProfileAnimations() {
    const elements = [
      '.profile-header',
      '.quick-stats',
      '.dashboard-section',
      '.activity-tabs'
    ];
    
    elements.forEach((selector, index) => {
      const element = document.querySelector(selector);
      if (element) {
        setTimeout(() => {
          element.style.opacity = '0';
          element.style.transform = 'translateY(30px)';
          element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          
          requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
          });
        }, index * 200);
      }
    });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const searchBtn = document.getElementById('search-btn');
    
    if (searchBtn) {
      if (loading) {
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        searchBtn.disabled = true;
        document.body.classList.add('loading');
      } else {
        searchBtn.innerHTML = '<i class="fas fa-arrow-right"></i>';
        searchBtn.disabled = false;
        document.body.classList.remove('loading');
      }
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${this.getNotificationIcon(type)}"></i>
      <span>${message}</span>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'}-color);
      color: var(--text-primary);
      padding: 16px 20px;
      border-radius: var(--border-radius);
      box-shadow: 0 8px 32px var(--shadow-color);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 300px;
      transform: translateX(400px);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });
    
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'exclamation-circle';
      case 'warning': return 'exclamation-triangle';
      default: return 'info-circle';
    }
  }

  formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays} дней назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  bindNoteModalEvents() {
    const saveBtn = document.getElementById('save-note-btn');
    const cancelBtn = document.getElementById('cancel-note-btn');
    if (saveBtn) saveBtn.onclick = () => this.saveNote();
    if (cancelBtn) cancelBtn.onclick = () => this.closeNoteModal();
  }

  openNoteModal(discordId) {
    this.currentNoteUserId = discordId;
    const user = this.trackingList.find(u => u.userId === discordId);
    document.getElementById('note-text').value = user && user.notes ? user.notes : '';
    document.getElementById('note-modal').style.display = 'block';
  }

  closeNoteModal() {
    document.getElementById('note-modal').style.display = 'none';
    this.currentNoteUserId = null;
  }

  async saveNote() {
    const note = document.getElementById('note-text').value;
    const discordId = this.currentNoteUserId;
    if (!discordId) return;
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/track/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ discordId, note })
      });
      const data = await response.json();
      if (data.success) {
        this.showNotification(data.message || 'Заметка сохранена!', 'success');
        this.closeNoteModal();
        this.loadTrackingList();
      } else {
        this.showNotification(data.error || 'Ошибка при сохранении заметки', 'error');
      }
    } catch (error) {
      console.error('Save note error:', error);
      this.handleConnectionError(error);
    }
  }

  // Add method to refresh user data
  async refreshUserData(discordId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/search/${discordId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.displayUserProfile(data.data.user);
          this.showNotification('Данные пользователя обновлены!', 'success');
        }
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      this.showNotification('Ошибка при обновлении данных', 'error');
    }
  }

  // Add method to check if user is tracked
  isUserTracked(discordId) {
    return this.trackingList.some(user => user.userId === discordId);
  }

  // Add method to get tracked user
  getTrackedUser(discordId) {
    return this.trackingList.find(user => user.userId === discordId);
  }

  // Add method to update tracking priority
  async updateTrackingPriority(discordId, priority) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/track/${discordId}/priority`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ priority })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.message || 'Приоритет обновлен!', 'success');
        this.loadTrackingList();
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при обновлении приоритета', 'error');
      }
    } catch (error) {
      console.error('Update priority error:', error);
      this.showNotification('Ошибка при обновлении приоритета', 'error');
    }
  }

  // Add method to handle connection errors
  handleConnectionError(error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      this.showNotification('Нет соединения с сервером. Проверьте подключение.', 'error');
    } else if (error.message.includes('timeout')) {
      this.showNotification('Превышено время ожидания. Попробуйте еще раз.', 'error');
    } else {
      this.showNotification('Произошла ошибка: ' + error.message, 'error');
    }
  }

  // Add method to share profile
  shareProfile(userData) {
    if (navigator.share) {
      navigator.share({
        title: `Discord Profile: ${userData.displayName || userData.username}`,
        text: `Профиль пользователя Discord: ${userData.displayName || userData.username}`,
        url: window.location.href
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      const profileUrl = `${window.location.origin}/?search=${userData.discordId}`;
      navigator.clipboard.writeText(profileUrl).then(() => {
        this.showNotification('Ссылка на профиль скопирована в буфер обмена!', 'success');
      }).catch(() => {
        this.showNotification('Не удалось скопировать ссылку', 'error');
      });
    }
  }

  // Add method to check server health
  async checkServerHealth() {
    try {
      const response = await fetch('https://ds-chekcer-1.onrender.com/health', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Server health check passed:', data);
      } else {
        console.warn('⚠️ Server health check failed');
      }
    } catch (error) {
      console.warn('⚠️ Server not available:', error.message);
    }
  }

  // Add method to update notification badge
  updateNotificationBadge() {
    const notificationBadge = document.querySelector('.notification-badge');
    if (notificationBadge) {
      const highRiskUsers = this.trackingList.filter(user => user.riskScore >= 70).length;
      notificationBadge.textContent = highRiskUsers;
      
      if (highRiskUsers > 0) {
        notificationBadge.style.display = 'block';
      } else {
        notificationBadge.style.display = 'none';
      }
    }
  }

  // Add method to show high risk users
  showHighRiskUsers() {
    const highRiskUsers = this.trackingList.filter(user => user.riskScore >= 70);
    
    if (highRiskUsers.length === 0) {
      this.showNotification('Нет пользователей с высоким риском', 'info');
      return;
    }
    
    // Show tracking page with high risk filter
    this.showTracking();
    
    // Apply high risk filter
    const riskFilter = document.getElementById('risk-filter');
    if (riskFilter) {
      riskFilter.value = 'high';
      this.applyTrackingFilters();
    }
  }

  // Add method to validate search input
  validateSearchInput(input) {
    const value = input.value.trim();
    const searchBtn = document.getElementById('search-btn');
    
    if (value.length === 0) {
      input.style.borderColor = '';
      if (searchBtn) searchBtn.disabled = false;
      return;
    }
    
    if (!/^\d{0,19}$/.test(value)) {
      input.style.borderColor = 'var(--danger-color)';
      if (searchBtn) searchBtn.disabled = true;
      return;
    }
    
    if (value.length >= 18 && value.length <= 19) {
      input.style.borderColor = 'var(--success-color)';
      if (searchBtn) searchBtn.disabled = false;
    } else {
      input.style.borderColor = 'var(--warning-color)';
      if (searchBtn) searchBtn.disabled = false;
    }
  }

  // Save application state to localStorage
  saveApplicationState() {
    try {
      const state = {
        currentSection: this.currentSection,
        searchHistory: this.searchHistory || [],
        lastActivity: new Date().toISOString(),
        theme: this.userProfile?.preferences?.theme || 'dark',
        notifications: this.userProfile?.preferences?.notifications !== false
      };
      
      localStorage.setItem('discordTrackerState', JSON.stringify(state));
      console.log('💾 Application state saved');
    } catch (error) {
      console.error('❌ Failed to save application state:', error);
    }
  }

  // Load application state from localStorage
  loadApplicationState() {
    try {
      const savedState = localStorage.getItem('discordTrackerState');
      if (savedState) {
        const state = JSON.parse(savedState);
        
        // Restore theme
        if (state.theme) {
          document.body.setAttribute('data-theme', state.theme);
        }
        
        // Restore last section if user is authenticated
        if (this.isAuthenticated && state.currentSection) {
          this.currentSection = state.currentSection;
        }
        
        console.log('📂 Application state loaded');
        return state;
      }
    } catch (error) {
      console.error('❌ Failed to load application state:', error);
    }
    return null;
  }

  // Clear application state
  clearApplicationState() {
    try {
      localStorage.removeItem('discordTrackerState');
      console.log('🗑️ Application state cleared');
    } catch (error) {
      console.error('❌ Failed to clear application state:', error);
    }
  }

  // Force refresh servers data
  forceRefreshServers() {
    console.log('🔄 Force refreshing servers data...');
    this.loadServers();
  }

  // Test function to load demo data immediately
  testDemoData() {
    console.log('🧪 Testing demo data loading...');
    this.loadDemoServers();
  }

  // Update track button based on tracking status
  updateTrackButton(user) {
    const trackBtn = document.getElementById('track-btn');
    if (!trackBtn) return;
    
    console.log('[DEBUG] updateTrackButton called for user:', user);
    console.log('[DEBUG] User discordId:', user.discordId);
    console.log('[DEBUG] Current tracking list:', this.trackingList);
    
    // Remove existing event listeners to prevent duplication
    const newTrackBtn = trackBtn.cloneNode(true);
    trackBtn.parentNode.replaceChild(newTrackBtn, trackBtn);
    
    const isTracked = this.trackingList && this.trackingList.some(trackedUser => {
      const matches = trackedUser.userId === user.discordId || trackedUser.discordId === user.discordId;
      console.log('[DEBUG] Checking trackedUser:', trackedUser, 'against user.discordId:', user.discordId, 'matches:', matches);
      return matches;
    });
    
    console.log('[DEBUG] isTracked result:', isTracked);
    
    if (isTracked) {
      newTrackBtn.innerHTML = '<i class="fas fa-check"></i> Уже отслеживается';
      newTrackBtn.className = 'btn btn-success';
      newTrackBtn.onclick = () => {
        this.removeFromTracking(user.discordId);
      };
    } else {
      newTrackBtn.innerHTML = '<i class="fas fa-plus"></i> Добавить в отслеживание';
      newTrackBtn.className = 'btn btn-primary';
      newTrackBtn.onclick = () => {
        this.addToTracking(user.discordId);
      };
    }
  }

  // Remove user from tracking
  async removeFromTracking(discordId) {
    if (confirm('Вы уверены, что хотите убрать этого пользователя из отслеживания?')) {
      try {
        const response = await fetch(`${this.apiBaseUrl}/user/untrack/${discordId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          this.showNotification(data.message || 'Пользователь удален из отслеживания', 'success');
          
          // Update current user tracking status
          if (this.currentUser && this.currentUser.discordId === discordId) {
            this.currentUser.isTracked = false;
            this.updateTrackButton(this.currentUser);
          }
          
          // Update tracking list if visible
          this.loadTrackingList();
          
        } else {
          const errorData = await response.json().catch(() => ({}));
          this.showNotification(errorData.error || 'Ошибка при удалении', 'error');
        }
      } catch (error) {
        console.error('Remove from tracking error:', error);
        this.showNotification('Ошибка подключения к серверу', 'error');
      }
    }
  }

  // Add user to tracking
  async addToTracking(discordId) {
    console.log('[DEBUG] addToTracking called with discordId:', discordId);
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ discordId })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.message || 'Пользователь добавлен в отслеживание', 'success');
        
        // Update current user tracking status
        if (this.currentUser && this.currentUser.discordId === discordId) {
          this.currentUser.isTracked = true;
          this.updateTrackButton(this.currentUser);
        }
        
        // Load full user profile data to ensure we have complete information
        await this.loadUserProfileData(discordId);
        
        // Force reload tracking list to get fresh data
        await this.loadTrackingList();
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при добавлении', 'error');
      }
    } catch (error) {
      console.error('Add to tracking error:', error);
      this.showNotification('Ошибка подключения к серверу', 'error');
    }
  }

  // View user profile
  viewUserProfile(discordId) {
    // Search for the user profile
    const searchInput = document.getElementById('discord-search');
    if (searchInput) {
      searchInput.value = discordId;
      this.performSearch();
    }
  }

  // Load full user profile data
  async loadUserProfileData(discordId) {
    try {
      console.log('[DEBUG] Loading user profile data for:', discordId);

      // Fetch from the new external API
      let response = await fetch(`https://fishonxd.su/api/checks/user/${discordId}`);
      let userData = null;
      if (response.ok) {
        const responseData = await response.json();
        userData = responseData.data || responseData;
        console.log('[DEBUG] User profile data loaded from fishonxd.su:', userData);
      } else {
        console.warn('[WARN] Could not load user data from fishonxd.su, status:', response.status);
        // fallback to old API if needed
        response = await fetch(`${this.apiBaseUrl}/user/${discordId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const responseData = await response.json();
          if (responseData.data && responseData.data.user) {
            userData = responseData.data.user;
          } else if (responseData.user) {
            userData = responseData.user;
          } else {
            userData = responseData;
          }
        }
      }
      if (userData) {
        this.displayUserProfile(userData);
      } else {
        alert('Не удалось загрузить данные пользователя.');
      }
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e);
      alert('Ошибка загрузки профиля пользователя.');
    }
  }

  // Calculate account age from creation date
  calculateAccountAge(createdAt) {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Load complete user data for all tracked users
  async loadCompleteUserDataForTracking() {
    if (!this.trackingList || this.trackingList.length === 0) return;
    
    console.log('[DEBUG] Loading complete user data for tracking list...');
    console.log('[DEBUG] Current tracking list:', this.trackingList);
    
    // Load complete data for each tracked user
    for (const trackedUser of this.trackingList) {
      console.log('[DEBUG] Checking user:', trackedUser);
      if (trackedUser.userId && (!trackedUser.username || trackedUser.username === 'Unknown User')) {
        console.log('[DEBUG] Loading data for user with Unknown User:', trackedUser.userId);
        await this.loadUserProfileData(trackedUser.userId);
      } else {
        console.log('[DEBUG] Skipping user, already has data:', trackedUser.username);
      }
    }
  }

  // Add note to user
  async addNoteToUser(discordId, noteText) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ discordId, note: noteText })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.message || 'Заметка добавлена', 'success');
        
        // Update current user note if viewing same user
        if (this.currentUser && this.currentUser.discordId === discordId) {
          this.currentUser.note = noteText;
          this.displayUserNote(noteText);
        }
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при добавлении заметки', 'error');
      }
    } catch (error) {
      console.error('Add note error:', error);
      this.showNotification('Ошибка подключения к серверу', 'error');
    }
  }

  // Display user note
  displayUserNote(noteText) {
    const noteElement = document.getElementById('user-note');
    if (noteElement) {
      if (noteText) {
        noteElement.innerHTML = `
          <div class="user-note">
            <i class="fas fa-sticky-note"></i>
            <span>${this.escapeHtml(noteText)}</span>
            <button class="btn-edit-note" onclick="window.discordTracker.editNote()">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        `;
      } else {
        noteElement.innerHTML = `
          <button class="btn btn-outline" onclick="window.discordTracker.openNoteModal()">
            <i class="fas fa-plus"></i>
            Добавить заметку
          </button>
        `;
      }
    }
  }

  // Open note modal
  openNoteModal(discordId = null) {
    const modal = document.getElementById('note-modal');
    const noteText = document.getElementById('note-text');
    const saveBtn = document.getElementById('save-note-btn');
    
    if (modal && noteText && saveBtn) {
      // Set current user ID if not provided
      const userId = discordId || (this.currentUser ? this.currentUser.discordId : null);
      
      if (userId) {
        // Load existing note if available
        if (this.currentUser && this.currentUser.note) {
          noteText.value = this.currentUser.note;
        } else {
          noteText.value = '';
        }
        
        // Set save button action
        saveBtn.onclick = () => {
          this.addNoteToUser(userId, noteText.value);
          modal.style.display = 'none';
        };
        
        modal.style.display = 'block';
      } else {
        this.showNotification('Ошибка: ID пользователя не найден', 'error');
      }
    }
  }

  // Edit note
  editNote() {
    this.openNoteModal();
  }

  // Track user voice activity
  async trackUserVoiceActivity(discordId) {
    try {
      const response = await fetch(`/api/user/voice-activity/${discordId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateVoiceStats(data);
      }
    } catch (error) {
      console.error('Track voice activity error:', error);
    }
  }

  // Track user messages
  async trackUserMessages(discordId) {
    try {
      const response = await fetch(`/api/user/messages/${discordId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.updateMessageStats(data);
      }
    } catch (error) {
      console.error('Track messages error:', error);
    }
  }

  // Track user views (once per day per user)
  async trackUserView(discordId) {
    const viewKey = `user_view_${discordId}_${new Date().toDateString()}`;
    
    if (!localStorage.getItem(viewKey)) {
      try {
        const response = await fetch('/api/user/view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ discordId })
        });
        
        if (response.ok) {
          localStorage.setItem(viewKey, 'true');
          this.updateViewStats();
        }
      } catch (error) {
        console.error('Track view error:', error);
      }
    }
  }

  // Update voice statistics
  updateVoiceStats(data) {
    const voiceTimeElement = document.getElementById('voice-time');
    if (voiceTimeElement && data.totalVoiceTime) {
      const hours = Math.floor(data.totalVoiceTime / 3600);
      const minutes = Math.floor((data.totalVoiceTime % 3600) / 60);
      voiceTimeElement.textContent = `${hours}ч ${minutes}м`;
    }
  }

  // Update message statistics
  updateMessageStats(data) {
    const messageCountElement = document.getElementById('message-count');
    if (messageCountElement && data.messageCount !== undefined) {
      messageCountElement.textContent = data.messageCount.toLocaleString();
    }
  }

  // Update view statistics
  updateViewStats() {
    const viewsCountElement = document.getElementById('views-count');
    if (viewsCountElement) {
      const currentViews = parseInt(viewsCountElement.textContent) || 0;
      viewsCountElement.textContent = (currentViews + 1).toLocaleString();
    }
  }

  // Track user channel location
  async trackUserChannel(discordId) {
    try {
      const response = await fetch(`/api/user/channel/${discordId}`, {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.displayUserChannel(data);
      }
    } catch (error) {
      console.error('Track channel error:', error);
    }
  }

  // Display user current channel
  displayUserChannel(channelData) {
    const channelElement = document.getElementById('user-channel');
    if (channelElement && channelData) {
      if (channelData.channelName) {
        channelElement.innerHTML = `
          <div class="user-channel">
            <i class="fas fa-hashtag"></i>
            <span>${this.escapeHtml(channelData.channelName)}</span>
            <span class="channel-server">в ${this.escapeHtml(channelData.serverName)}</span>
          </div>
        `;
      } else {
        channelElement.innerHTML = `
          <div class="user-channel offline">
            <i class="fas fa-circle"></i>
            <span>Не в сети</span>
          </div>
        `;
      }
    }
  }

  // Reputation system
  async changeUserReputation(discordId, change) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/reputation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ discordId, change })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.showNotification(data.message || 'Репутация изменена', 'success');
        
        // Update current user reputation if viewing same user
        if (this.currentUser && this.currentUser.discordId === discordId) {
          this.currentUser.reputation = data.newReputation;
          this.displayUserReputation(data.newReputation);
        }
        
        // Update reputation buttons state
        this.updateReputationButtons(discordId);
        
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.showNotification(errorData.error || 'Ошибка при изменении репутации', 'error');
      }
    } catch (error) {
      console.error('Change reputation error:', error);
      this.showNotification('Ошибка подключения к серверу', 'error');
    }
  }

  // Display user reputation
  displayUserReputation(reputation = 0) {
    const valueEl = document.getElementById('reputation-value');
    const iconEl = document.getElementById('reputation-emoji');
    if (!valueEl || !iconEl) return;
    valueEl.textContent = reputation;
    // Цветовая индикация и иконка
    if (reputation > 0) {
      iconEl.textContent = '🌟';
      valueEl.style.background = 'linear-gradient(90deg, #00d4ff 0%, #4ecdc4 100%)';
      valueEl.style.webkitTextFillColor = 'transparent';
      valueEl.style.textShadow = '0 2px 12px #00d4ff44';
    } else if (reputation < 0) {
      iconEl.textContent = '💢';
      valueEl.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ffb88c 100%)';
      valueEl.style.webkitTextFillColor = 'transparent';
      valueEl.style.textShadow = '0 2px 12px #ff6b6b44';
    } else {
      iconEl.textContent = '⭐';
      valueEl.style.background = 'linear-gradient(90deg, #aaa 0%, #eee 100%)';
      valueEl.style.webkitTextFillColor = 'transparent';
      valueEl.style.textShadow = '0 2px 12px #aaa4';
    }
    valueEl.classList.remove('rep-pop');
    void valueEl.offsetWidth; // restart animation
    valueEl.classList.add('rep-pop');
  }

  // Улучшенный кулдаун и тултипы
  updateReputationButtons(discordId) {
    const upvoteBtn = document.getElementById('reputation-upvote');
    const downvoteBtn = document.getElementById('reputation-downvote');
    const cooldownEl = document.getElementById('reputation-cooldown');
    if (!upvoteBtn || !downvoteBtn || !cooldownEl) return;
    const lastVote = localStorage.getItem(`reputation_vote_${discordId}`);
    const canVote = !lastVote || (Date.now() - parseInt(lastVote)) > 12 * 60 * 60 * 1000;
    if (canVote) {
      upvoteBtn.disabled = false;
      downvoteBtn.disabled = false;
      cooldownEl.style.display = 'none';
      upvoteBtn.title = 'Повысить репутацию';
      downvoteBtn.title = 'Понизить репутацию';
    } else {
      upvoteBtn.disabled = true;
      downvoteBtn.disabled = true;
      const remaining = 12 * 60 * 60 * 1000 - (Date.now() - parseInt(lastVote));
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      cooldownEl.style.display = 'block';
      cooldownEl.textContent = `Голосовать можно через ${hours > 0 ? hours + 'ч ' : ''}${mins} мин.`;
      upvoteBtn.title = cooldownEl.textContent;
      downvoteBtn.title = cooldownEl.textContent;
    }
  }

  // Улучшенные обработчики
  handleReputationUpvote(discordId) {
    if (!discordId && this.currentUser) discordId = this.currentUser.discordId;
    this.changeUserReputation(discordId, 1);
    localStorage.setItem(`reputation_vote_${discordId}`, Date.now().toString());
    this.updateReputationButtons(discordId);
    this.showNotification('👍 Репутация увеличена!', 'success');
  }
  handleReputationDownvote(discordId) {
    if (!discordId && this.currentUser) discordId = this.currentUser.discordId;
    this.changeUserReputation(discordId, -1);
    localStorage.setItem(`reputation_vote_${discordId}`, Date.now().toString());
    this.updateReputationButtons(discordId);
    this.showNotification('👎 Репутация уменьшена!', 'warning');
  }

  async initialize() {
    console.log('🚀 Initializing Discord Tracker...');
    
    try {
      // Check authentication status
      await this.checkAuthStatus();
      
      // Load tracking list
      await this.loadTrackingList();
      
      // Load initial dashboard
      await this.loadHomeDashboard();
      
      // Bind events
      this.bindEvents();
      
      console.log('✅ Discord Tracker initialized successfully');
    } catch (error) {
      console.error('❌ Initialization error:', error);
      this.handleConnectionError(error);
    }
  }

  // --- НОВАЯ СИСТЕМА РЕПУТАЦИИ ---

  // Вызов при открытии профиля
  async fetchAndDisplayReputation(discordId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/${discordId}/reputation`, { credentials: 'include' });
      if (!response.ok) throw new Error('Ошибка получения репутации');
      const data = await response.json();
      this.updateReputationUI(data);
    } catch (e) {
      this.updateReputationUI({ reputation: 0, canVote: false, nextVoteAt: null, votedType: null });
      this.showNotification('Ошибка загрузки репутации', 'error');
    }
  }

  // Обновление UI блока репутации
  updateReputationUI({ reputation = 0, canVote = true, nextVoteAt = null, votedType = null }) {
    const valueEl = document.getElementById('reputation-value');
    const emojiEl = document.getElementById('reputation-emoji');
    const upBtn = document.getElementById('reputation-upvote');
    const downBtn = document.getElementById('reputation-downvote');
    const cooldownEl = document.getElementById('reputation-cooldown');
    if (!valueEl || !upBtn || !downBtn || !cooldownEl) return;

    valueEl.textContent = reputation;
    // Цветовая индикация
    valueEl.classList.remove('positive', 'negative', 'neutral');
    if (reputation > 0) valueEl.classList.add('positive');
    else if (reputation < 0) valueEl.classList.add('negative');
    else valueEl.classList.add('neutral');

    // Эмодзи
    emojiEl.textContent = reputation > 0 ? '⭐' : reputation < 0 ? '👎' : '👍';

    // Кнопки
    upBtn.disabled = !canVote;
    downBtn.disabled = !canVote;
    upBtn.classList.toggle('active', votedType === 'up');
    downBtn.classList.toggle('active', votedType === 'down');

    // Таймер
    if (!canVote && nextVoteAt) {
      const next = new Date(nextVoteAt);
      const now = new Date();
      let diff = Math.max(0, next - now);
      if (diff > 0) {
        cooldownEl.style.display = 'block';
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        cooldownEl.textContent = `Голосовать можно через ${h > 0 ? h + 'ч ' : ''}${m}м ${s}с`;
        // Автообновление таймера
        clearTimeout(this._repTimer);
        this._repTimer = setTimeout(() => this.updateReputationUI({ reputation, canVote, nextVoteAt, votedType }), 1000);
      } else {
        cooldownEl.style.display = 'none';
      }
    } else {
      cooldownEl.style.display = 'none';
      clearTimeout(this._repTimer);
    }
  }

  // Голосование (лайк/дизлайк)
  async voteReputation(discordId, type) {
    if (!discordId) {
      this.showNotification('Неверный Discord ID', 'error');
      return;
    }
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/${discordId}/reputation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type })
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Ошибка голосования');
      this.updateReputationUI(data);
      this.showNotification(type === 'up' ? '👍 Репутация повышена!' : '👎 Репутация понижена!', 'success');
    } catch (e) {
      this.showNotification(e.message || 'Ошибка голосования', 'error');
    }
  }

  // Навесить обработчики на кнопки
  bindReputationEvents() {
    const upBtn = document.getElementById('reputation-upvote');
    const downBtn = document.getElementById('reputation-downvote');
    if (upBtn) upBtn.onclick = () => this.voteReputation(this.currentUser?.discordId, 'up');
    if (downBtn) downBtn.onclick = () => this.voteReputation(this.currentUser?.discordId, 'down');
  }

  // Вызов этих функций при открытии профиля:
  // this.fetchAndDisplayReputation(userData.discordId);
  // this.bindReputationEvents();

  // --- Система просмотров ---
  
  // Получить и отобразить количество просмотров
  async fetchAndDisplayViews(discordId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/${discordId}/views`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (response.ok) {
        this.updateViewsUI(data);
      }
    } catch (error) {
      console.error('❌ Error fetching views:', error);
    }
  }

  // Добавить просмотр
  async addView(discordId) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/user/${discordId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        this.updateViewsUI(data);
        this.showNotification('👁️ Просмотр добавлен!', 'success');
      } else if (response.status === 429) {
        // Не показываем уведомление о 24-часовом кулдауне
        // this.showNotification(data.error, 'warning');
      } else {
        throw new Error(data.error || 'Ошибка добавления просмотра');
      }
    } catch (error) {
      this.showNotification(error.message || 'Ошибка добавления просмотра', 'error');
    }
  }

  // Обновить UI просмотров
  updateViewsUI(viewsData) {
    const viewsEl = document.getElementById('user-views');
    const viewsCountEl = document.getElementById('views-count');
    const viewsCooldownEl = document.getElementById('views-cooldown');
    
    if (viewsCountEl) {
      viewsCountEl.textContent = viewsData.viewCount || 0;
    }
    
    if (viewsCooldownEl) {
      // Скрываем информацию о кулдауне - пользователь не хочет видеть "Просматривать можно раз в 24ч"
      viewsCooldownEl.style.display = 'none';
      clearTimeout(this._viewsTimer);
    }
  }

  // Форматирование оставшегося времени
  formatTimeLeft(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${seconds}с`;
    } else if (minutes > 0) {
      return `${minutes}м ${seconds}с`;
    } else {
      return `${seconds}с`;
    }
  }

  // Автоматически добавлять просмотр при открытии профиля
  autoAddView(discordId) {
    if (discordId && this.isAuthenticated) {
      this.addView(discordId);
    }
  }

  updateDiscordProfileExtras(userData) {
    // Show globalName, usernames on servers, old nicknames, active voice, last voice
    const profileInfo = document.getElementById('user-profile-info');
    if (!profileInfo) return;
    let html = '';
    // Global name
    if (userData.globalName) {
      html += `<div><b>Глобальный ник:</b> ${userData.globalName}</div>`;
    }
    // Usernames on servers
    if (userData.mutualGuilds && userData.mutualGuilds.servers) {
      html += '<div><b>Ники на серверах:</b><ul>';
      userData.mutualGuilds.servers.forEach(server => {
        let name = server.nickname || userData.globalName || userData.username;
        html += `<li>${server.guild.name}: <b>${name}</b></li>`;
      });
      html += '</ul></div>';
    }
    // Old nicknames
    if (userData.lastUsernames && userData.lastUsernames.length > 0) {
      html += '<div><b>Старые ники:</b><ul>';
      userData.lastUsernames.forEach(entry => {
        html += `<li>${entry.username.old} → ${entry.username.new} (сервер: ${entry.guildId})</li>`;
      });
      html += '</ul></div>';
    }
    // Active voice channel
    if (userData.voice && userData.voice.channel) {
      html += `<div><b>В голосовом канале:</b> ${userData.voice.channel.name} (сервер: ${userData.voice.guild.name})</div>`;
    }
    // Last time in voice (if not currently in voice)
    if ((!userData.voice || !userData.voice.channel) && userData.lastVoiceTime) {
      html += `<div><b>Последний раз в голосе:</b> ${userData.lastVoiceTime}</div>`;
    }
    profileInfo.innerHTML = html;
  }

}

// Global functions for onclick handlers
function loginWithDiscord() {
  window.location.href = 'https://ds-chekcer-1.onrender.com/auth/discord';
}

function logout() {
  window.location.href = 'https://ds-chekcer-1.onrender.com/auth/logout';
}

function showProfile() {
  window.discordTracker.navigateToSection('search');
}

function showSettings() {
  window.discordTracker.showSettings();
}

function showTracking() {
  window.discordTracker.navigateToSection('tracking');
}

function showDashboard() {
  window.discordTracker.navigateToSection('search');
}

function editProfile() {
  window.discordTracker.showSettings();
}

function saveSettings() {
  window.discordTracker.saveSettings();
}









// Reputation functions
function handleReputationUpvote() {
  if (window.discordTracker && window.discordTracker.currentUser) {
    window.discordTracker.handleReputationUpvote(window.discordTracker.currentUser.discordId);
  }
}

function handleReputationDownvote() {
  if (window.discordTracker && window.discordTracker.currentUser) {
    window.discordTracker.handleReputationDownvote(window.discordTracker.currentUser.discordId);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add CSS for notifications
  const style = document.createElement('style');
  style.textContent = `
    .notification-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: var(--transition);
    }
    
    .notification-close:hover {
      color: var(--text-primary);
      background: var(--bg-hover);
    }
    
    .btn-success {
      background: var(--gradient-success) !important;
    }
    
    .gradient-success {
      background: linear-gradient(135deg, #57f287 0%, #3ba55c 100%);
    }
    
    .empty-state {
      text-align: center;
      padding: 48px;
      color: var(--text-muted);
    }
    
    .empty-state i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    .empty-state h3 {
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    
    .risk-high {
      color: var(--danger-color);
      font-weight: 600;
    }
    
    .risk-medium {
      color: var(--warning-color);
      font-weight: 600;
    }
    
    .risk-low {
      color: var(--success-color);
      font-weight: 600;
    }
  `;
  document.head.appendChild(style);
  
  // Initialize Discord Tracker
  window.discordTracker = new DiscordTracker();
  
  // Add interactive features
  addInteractiveFeatures();
});

function addInteractiveFeatures() {
  // Add hover effects to cards
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.stat-item, .activity-card, .server-item')) {
      e.target.closest('.stat-item, .activity-card, .server-item').style.transform = 'translateY(-4px)';
    }
  });
  
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.stat-item, .activity-card, .server-item')) {
      e.target.closest('.stat-item, .activity-card, .server-item').style.transform = 'translateY(0)';
    }
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('discord-search');
      if (searchInput) searchInput.focus();
    }
  });
  
  // Add smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiscordTracker;
}
