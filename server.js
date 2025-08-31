require('dotenv').config({ path: './config.env' });

// Check if dotenv loaded successfully
if (!process.env.DISCORD_CLIENT_ID) {
  console.error('❌ Failed to load environment variables from config.env');
  console.error('💡 Please check if config.env exists and contains the required variables');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'MONGODB_URI',
  'JWT_SECRET',
  'SESSION_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('💡 Please check your config.env file');
  process.exit(1);
}

console.log('✅ All required environment variables are loaded');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  console.log('🗄️ Database:', process.env.MONGODB_URI.split('/').pop());
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  console.error('🔗 Connection string:', process.env.MONGODB_URI);
  console.error('💡 Please check your MongoDB connection and try again');
  process.exit(1);
});

// MongoDB connection monitoring
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Models
let User, TrackedUser, Reputation, Views;

try {
  User = require('./models/User');
  TrackedUser = require('./models/TrackedUser');
  Reputation = require('./models/Reputation');
  Views = require('./models/Views');
  console.log('✅ Database models loaded successfully');
} catch (error) {
  console.error('❌ Failed to load database models:', error);
  console.error('💡 Please check if models/User.js, models/TrackedUser.js, models/Reputation.js, and models/Views.js exist');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'style.css')));
app.use('/js', express.static(path.join(__dirname, 'script.js')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: false,
  cookie: {
    secure: false, // Changed to false for development (HTTP)
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days instead of 24 hours
    httpOnly: true,
    sameSite: 'lax'
  },
  name: 'discord-tracker-session',
  store: new session.MemoryStore(), // Use memory store for development
  rolling: true, // Extend session on each request
  unset: 'destroy' // Remove session when unset
}));

// Session validation middleware
app.use((req, res, next) => {
  // Log session information for debugging
  if (req.session) {
    console.log('🔐 Session middleware - Session ID:', req.sessionID);
    console.log('🔐 Session middleware - Session exists:', !!req.session);
    console.log('🔐 Session middleware - User in session:', !!req.session.passport);
    
    // Extend session if user is authenticated
    if (req.session.passport && req.session.passport.user) {
      req.session.touch(); // Touch the session to extend it
      console.log('🔐 Session extended for user');
    }
  } else {
    console.log('🔐 Session middleware - No session found');
  }
  next();
});

// Session refresh middleware
app.use((req, res, next) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    // Update last activity timestamp
    req.session.lastActivity = new Date();
    console.log('🔐 Session activity updated for user');
  }
  next();
});

// Session error handling
app.use((err, req, res, next) => {
  if (err.code === 'ECONNRESET') {
    console.warn('⚠️ Session connection reset');
    return res.status(500).json({ error: 'Session error, please try again' });
  }
  
  if (err.name === 'SessionError') {
    console.error('❌ Session error:', err);
    return res.status(500).json({ error: 'Session configuration error' });
  }
  
  next(err);
});

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Passport error handling
app.use((err, req, res, next) => {
  if (err.name === 'AuthenticationError') {
    console.error('❌ Passport authentication error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
  
  if (err.name === 'SessionError') {
    console.error('❌ Passport session error:', err);
    return res.status(500).json({ error: 'Session error' });
  }
  
  if (err.name === 'StrategyError') {
    console.error('❌ Passport strategy error:', err);
    return res.status(500).json({ error: 'Authentication strategy error' });
  }
  
  // Handle Discord OAuth specific errors
  if (err.message && err.message.includes('Invalid "code"')) {
    console.error('❌ Discord OAuth code error:', err);
    console.error('💡 This usually means the callback URL is not configured correctly');
    return res.status(400).json({ 
      error: 'Discord OAuth configuration error',
      message: 'Please check your Discord Application settings',
      details: 'Invalid authorization code received'
    });
  }
  
  if (err.message && err.message.includes('Invalid redirect_uri')) {
    console.error('❌ Discord OAuth redirect URI error:', err);
    return res.status(400).json({ 
      error: 'Discord OAuth redirect URI mismatch',
      message: 'Callback URL does not match Discord Application settings'
    });
  }
  
  next(err);
});

// Discord OAuth Strategy
try {
  console.log('🔐 Configuring Discord OAuth strategy...');
  console.log('🔐 Client ID:', process.env.DISCORD_CLIENT_ID);
  console.log('🔐 Callback URL:', process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback');
  
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    scope: ['identify', 'email', 'guilds']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('🔐 Discord OAuth callback received for user:', profile.username);
      console.log('🔐 Profile ID:', profile.id);
      console.log('🔐 Profile email:', profile.email);
      
      // Validate profile data
      if (!profile.id || !profile.username) {
        console.error('❌ Invalid profile data received from Discord');
        return done(new Error('Invalid profile data from Discord'), null);
      }
      
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected during OAuth');
        return done(new Error('Database not available'), null);
      }
      
      // Find or create user
      let user;
      try {
        user = await User.findOne({ discordId: profile.id });
        console.log('🔍 User lookup result:', user ? 'Found existing user' : 'User not found');
      } catch (dbError) {
        console.error('❌ Database lookup error during OAuth:', dbError);
        return done(dbError, null);
      }
      
      if (!user) {
        console.log('👤 Creating new user:', profile.username);
        try {
          user = new User({
            discordId: profile.id,
            username: profile.username,
            discriminator: profile.discriminator,
            avatar: profile.avatar,
            email: profile.email,
            accessToken,
            refreshToken,
            guilds: profile.guilds || []
          });
          
          console.log('👤 New user object created:', {
            discordId: user.discordId,
            username: user.username,
            email: user.email
          });
          
          await user.save();
          console.log('✅ New user created:', profile.username);
        } catch (createError) {
          console.error('❌ Failed to create user:', createError);
          console.error('❌ Create error details:', createError.message);
          return done(createError, null);
        }
      } else {
        console.log('👤 Updating existing user:', profile.username);
        try {
          // Update existing user
          user.username = profile.username;
          user.discriminator = profile.discriminator;
          user.avatar = profile.avatar;
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          user.guilds = profile.guilds || [];
          user.lastLogin = new Date();
          
          console.log('👤 User object updated:', {
            discordId: user.discordId,
            username: user.username,
            lastLogin: user.lastLogin
          });
          
          await user.save();
          console.log('✅ User updated:', profile.username);
        } catch (updateError) {
          console.error('❌ Failed to update user:', updateError);
          console.error('❌ Update error details:', updateError.message);
          return done(updateError, null);
        }
      }
      
      console.log('✅ OAuth strategy completed successfully for user:', profile.username);
      return done(null, user);
    } catch (error) {
      console.error('❌ Discord OAuth error:', error);
      console.error('❌ OAuth error stack:', error.stack);
      return done(error, null);
    }
  }));
  console.log('✅ Discord OAuth strategy configured successfully');
} catch (error) {
  console.error('❌ Failed to configure Discord OAuth strategy:', error);
  process.exit(1);
}

passport.serializeUser((user, done) => {
  try {
    console.log('🔐 Serializing user:', user.username);
    console.log('🔐 User ID to serialize:', user.id);
    
    // Store user ID in session
    done(null, user.id);
  } catch (error) {
    console.error('❌ Serialization error:', error);
    done(error, null);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('🔐 Deserializing user with ID:', id);
    
    const user = await User.findById(id);
    if (user) {
      console.log('✅ User deserialized successfully:', user.username);
      console.log('🔐 Session user data:', {
        id: user.id,
        username: user.username,
        discordId: user.discordId
      });
    } else {
      console.warn('⚠️ User not found during deserialization:', id);
    }
    done(null, user);
  } catch (error) {
    console.error('❌ Deserialization error:', error);
    done(error, null);
  }
});

// Routes
try {
  app.get('/', (req, res) => {
    try {
      console.log('🏠 Main route accessed');
      console.log('🔐 User authenticated:', req.isAuthenticated());
      console.log('🔐 Session ID:', req.sessionID);
      
      // Check for login messages
      const loginMessage = req.session?.loginMessage;
      if (loginMessage) {
        console.log('📝 Login message found:', loginMessage);
        delete req.session.loginMessage; // Clear the message
      }
      
      res.sendFile(path.join(__dirname, 'index.htm'));
    } catch (error) {
      console.error('❌ Main route error:', error);
      res.status(500).send('Internal server error');
    }
  });

  app.get('/dashboard', (req, res) => {
    try {
      console.log('📊 Dashboard route accessed');
      res.sendFile(path.join(__dirname, 'index.htm'));
    } catch (error) {
      console.error('❌ Dashboard route error:', error);
      res.status(500).send('Internal server error');
    }
  });

  app.get('/health', (req, res) => {
    try {
      const healthData = { 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        sessionStore: req.sessionStore ? 'available' : 'not available',
        sessionCount: req.sessionStore ? req.sessionStore.length : 'unknown',
        currentSession: {
          id: req.sessionID,
          exists: !!req.session,
          authenticated: req.isAuthenticated(),
          user: req.user ? {
            id: req.user.id,
            username: req.user.username
          } : null
        }
      };
      
      console.log('🏥 Health check:', healthData);
      res.json(healthData);
    } catch (error) {
      console.error('❌ Health check error:', error);
      res.status(500).json({ 
        status: 'ERROR', 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  console.log('✅ Basic routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register basic routes:', error);
  process.exit(1);
}

// Auth routes
try {
  app.get('/auth/discord', passport.authenticate('discord'));

  app.get('/auth/discord/callback', 
    (req, res, next) => {
      console.log('🔐 OAuth callback received');
      console.log('🔐 Query parameters:', req.query);
      console.log('🔐 Session ID:', req.sessionID);
      
      // Check if we have the required parameters
      if (!req.query.code) {
        console.error('❌ No authorization code received from Discord');
        return res.redirect('/?error=no_code');
      }
      
      next();
    },
    passport.authenticate('discord', { 
      failureRedirect: '/?error=login_failed',
      failureFlash: true 
    }),
    (req, res) => {
      try {
        console.log('🔐 OAuth callback successful, redirecting user');
        console.log('🔐 User ID:', req.user?.id);
        console.log('🔐 Username:', req.user?.username);
        
        // Set a success message in session
        if (req.session) {
          req.session.loginMessage = 'Successfully logged in with Discord!';
        }
        
        res.redirect('/');
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.redirect('/?error=login_failed');
      }
    }
  );

  app.get('/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.redirect('/');
    });
  });
  
  console.log('✅ Authentication routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register authentication routes:', error);
  process.exit(1);
}

// API Routes
try {
  app.get('/api/user/profile', ensureAuthenticated, async (req, res) => {
    try {
      console.log('👤 Profile request for user ID:', req.user.id);
      const user = await User.findById(req.user.id).select('-accessToken -refreshToken');
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      res.json({ success: true, user });
    } catch (error) {
      console.error('❌ Profile error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/user/tracking', ensureAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      res.json({ success: true, tracking: user.trackingList || [] });
    } catch (error) {
      console.error('❌ Tracking error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/user/track', ensureAuthenticated, async (req, res) => {
    try {
      const { discordId, username, avatar, notes, priority } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      // Check if already tracking
      const existing = user.trackingList.find(item => item.userId === discordId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'User already being tracked' });
      }
      
      user.trackingList.push({
        userId: discordId,
        username: username || 'Unknown User',
        avatar: avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        notes: notes || '',
        priority: priority || 'medium',
        addedAt: new Date()
      });
      
      await user.save();
      res.json({ success: true, message: 'User added to tracking' });
    } catch (error) {
      console.error('❌ Track user error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete('/api/user/untrack/:discordId', ensureAuthenticated, async (req, res) => {
    try {
      const { discordId } = req.params;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const initialLength = user.trackingList.length;
      user.trackingList = user.trackingList.filter(item => item.userId !== discordId);
      
      if (user.trackingList.length === initialLength) {
        return res.status(404).json({ success: false, error: 'User not found in tracking list' });
      }
      
      await user.save();
      
      res.json({ success: true, message: 'User removed from tracking' });
    } catch (error) {
      console.error('❌ Untrack user error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.put('/api/user/preferences', ensureAuthenticated, async (req, res) => {
    try {
      const { theme, notifications, language } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      if (!user.preferences) {
        user.preferences = {};
      }
      
      user.preferences = {
        theme: theme || user.preferences.theme || 'dark',
        notifications: notifications !== undefined ? notifications : (user.preferences.notifications !== undefined ? user.preferences.notifications : true),
        language: language || user.preferences.language || 'ru'
      };
      
      await user.save();
      res.json({ success: true, preferences: user.preferences });
    } catch (error) {
      console.error('❌ Preferences error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/user/track/note', ensureAuthenticated, async (req, res) => {
    try {
      const { discordId, note } = req.body;
      if (!discordId) return res.status(400).json({ success: false, error: 'discordId required' });
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const tracked = user.trackingList.find(item => item.userId === discordId);
      if (!tracked) return res.status(404).json({ success: false, error: 'User not found in tracking list' });
      tracked.notes = note;
      await user.save();
      res.json({ success: true, message: 'Note saved successfully' });
    } catch (error) {
      console.error('❌ Save note error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/search/:discordId', ensureAuthenticated, async (req, res) => {
    try {
      // Check MongoDB connection
      if (mongoose.connection.readyState !== 1) {
        console.error('❌ MongoDB not connected. State:', mongoose.connection.readyState);
        return res.status(500).json({ 
          success: false, 
          error: 'Database connection not available' 
        });
      }
      
      const { discordId } = req.params;
      console.log('🔍 Search request for Discord ID:', discordId, 'by user:', req.user.username);
      
      // Validate Discord ID format
      if (!/^\d{18,19}$/.test(discordId)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid Discord ID format. Must be 18-19 digits.' 
        });
      }
      
      // Check if user is already in our database
      let trackedUser;
      try {
        trackedUser = await TrackedUser.findOne({ discordId });
        console.log('🔍 Database lookup result:', trackedUser ? 'Found existing user' : 'User not found');
      } catch (dbError) {
        console.error('❌ Database lookup error:', dbError);
        return res.status(500).json({ 
          success: false, 
          error: 'Database lookup failed',
          details: dbError.message
        });
      }
      
      if (!trackedUser) {
        try {
          console.log('🔍 Fetching user data from external API...');
          // Fetch from external API
          const response = await axios.get(`https://corsproxy.io/?https://fishonxd.su/api/checks/user/${discordId}`, {
            timeout: 30000 // 30 second timeout
          });
          const data = response.data;
          
          console.log('🔍 External API response:', JSON.stringify(data, null, 2));
          
          if (data.success && data.data && data.data.user) {
            console.log('✅ Creating new tracked user from external API data');
            // Create new tracked user
            trackedUser = new TrackedUser({
              discordId: data.data.user.id,
              username: data.data.user.username,
              displayName: data.data.user.displayName,
              discriminator: data.data.user.discriminator,
              avatar: data.data.user.displayAvatarURL,
              bio: data.data.user.bio,
              nitro: data.data.user.nitro,
              clan: data.data.user.clan,
              badges: data.data.user.badges || [],
              createdAt: data.data.user.createdAt,
              lastSeen: data.data.user.lastSeen,
              status: data.data.user.status || 'offline',
              activity: {
                views: data.data.user.views || 0,
                messageCount: data.data.user.messageCount || 0,
                voiceTime: data.data.user.voiceTime || '0ч'
              }
            });
            
            await trackedUser.save();
            console.log('✅ New tracked user saved successfully');
          } else {
            console.log('❌ External API returned no user data');
            return res.status(404).json({ 
              success: false, 
              error: 'User not found in external API',
              details: data
            });
          }
        } catch (apiError) {
          console.error('❌ External API error:', apiError.message);
          console.error('❌ External API error details:', apiError.response?.data || 'No response data');
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch user data from external API',
            details: apiError.message
          });
        }
      }
      
      // Update last checked time and save
      try {
        trackedUser.lastChecked = new Date();
        trackedUser.checkCount += 1;
        await trackedUser.save();
        console.log('✅ Tracked user updated successfully');
      } catch (saveError) {
        console.error('❌ Failed to update tracked user:', saveError);
        // Continue with the response even if update fails
      }
      
      // Add to search history
      try {
        await User.findByIdAndUpdate(req.user.id, {
          $push: {
            searchHistory: {
              query: discordId,
              timestamp: new Date()
            }
          }
        });
        console.log('✅ Search history updated successfully');
      } catch (historyError) {
        console.error('❌ Failed to update search history:', historyError);
        // Continue with the response even if history update fails
      }
      
      console.log('✅ Search successful for Discord ID:', discordId);
      res.json({ success: true, data: { user: trackedUser } });
    } catch (error) {
      console.error('❌ Search error:', error);
      console.error('❌ Search error stack:', error.stack);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.get('/api/analytics/overview', ensureAuthenticated, async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const trackingCount = user.trackingList ? user.trackingList.length : 0;
      const recentSearches = user.searchHistory ? user.searchHistory.slice(-5).reverse() : [];
      
      res.json({
        success: true,
        data: {
          trackingCount,
          recentSearches,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('❌ Analytics error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.get('/api/session/status', (req, res) => {
    try {
      const sessionStatus = {
        sessionId: req.sessionID,
        sessionExists: !!req.session,
        passportData: !!req.session?.passport,
        userInSession: !!req.session?.passport?.user,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          discordId: req.user.discordId
        } : null,
        lastActivity: req.session?.lastActivity,
        sessionAge: req.session ? Math.floor((Date.now() - req.session.cookie.expires) / 1000) : null
      };
      
      console.log('🔐 Session status check:', sessionStatus);
      res.json({ success: true, data: sessionStatus });
    } catch (error) {
      console.error('❌ Session status error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // New API route for getting user details by Discord ID
  app.get('/api/user/:discordId', ensureAuthenticated, async (req, res) => {
    try {
      const { discordId } = req.params;
      const trackedUser = await TrackedUser.findOne({ discordId });
      
      if (!trackedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      res.json({ success: true, data: { user: trackedUser } });
    } catch (error) {
      console.error('❌ Get user error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // API route for updating tracking priority
  app.put('/api/user/track/:discordId/priority', ensureAuthenticated, async (req, res) => {
    try {
      const { discordId } = req.params;
      const { priority } = req.body;
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      
      const tracked = user.trackingList.find(item => item.userId === discordId);
      if (!tracked) {
        return res.status(404).json({ success: false, error: 'User not found in tracking list' });
      }
      
      tracked.priority = priority;
      await user.save();
      
      res.json({ success: true, message: 'Priority updated successfully' });
    } catch (error) {
      console.error('❌ Update priority error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- PROXY ROUTE FOR GUILDS (CORS BYPASS) ---
  app.get('/api/proxy/guilds', async (req, res) => {
    try {
      console.log('🌐 Proxying request to fishonxd.su/api/checks/guilds');
      const response = await axios.get('https://fishonxd.su/api/checks/guilds', {
        timeout: 20000
      });
      res.json(response.data);
    } catch (error) {
      console.error('❌ Proxy error:', error.message);
      res.status(500).json({ success: false, error: 'Proxy error', details: error.message });
    }
  });
  
  // --- Репутация пользователей (MongoDB) ---
  app.get('/api/user/:id/reputation', async (req, res) => {
    try {
      const userId = req.params.id;
      const voterId = req.user.id; // id текущего пользователя (из сессии)
      const rep = await Reputation.findOne({ userId });
      let canVote = true, nextVoteAt = null, votedType = null;
      if (rep && rep.votes) {
        const lastVote = rep.votes.find(v => v.voterId === voterId);
        if (lastVote) {
          votedType = lastVote.type;
          const last = new Date(lastVote.date);
          const now = new Date();
          if (now - last < 24 * 60 * 60 * 1000) {
            canVote = false;
            nextVoteAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
          }
        }
      }
      res.json({
        reputation: rep ? rep.value : 0,
        canVote,
        nextVoteAt,
        votedType
      });
    } catch (error) {
      console.error('❌ Error getting reputation:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.post('/api/user/:id/reputation', async (req, res) => {
    try {
      const userId = req.params.id;
      const voterId = req.user.id;
      const { type } = req.body;
      
      const rep = await Reputation.findOne({ userId });
      let canVote = true, nextVoteAt = null;
      if (rep && rep.votes) {
        const lastVote = rep.votes.find(v => v.voterId === voterId);
        if (lastVote) {
          const last = new Date(lastVote.date);
          const now = new Date();
          if (now - last < 24 * 60 * 60 * 1000) {
            canVote = false;
            nextVoteAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
          }
        }
      }
      if (!canVote) return res.status(429).json({ success: false, error: 'Голосовать можно раз в 24ч', nextVoteAt });
      
      // Обновить репутацию
      const value = type === 'up' ? 1 : -1;
      await Reputation.findOneAndUpdate(
        { userId },
        {
          $inc: { value },
          $push: { votes: { voterId, type, date: new Date() } }
        },
        { upsert: true, new: true }
      );
      
      // Вернуть новый статус
      const updated = await Reputation.findOne({ userId });
      res.json({
        success: true,
        reputation: updated.value,
        canVote: false,
        nextVoteAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        votedType: type
      });
    } catch (error) {
      console.error('❌ Error updating reputation:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  
  // --- Система просмотров пользователей (MongoDB) ---
  app.get('/api/user/:id/views', async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user.id; // id текущего пользователя (из сессии)
      const viewsData = await Views.findOne({ userId });
      
      let canView = true, nextViewAt = null;
      if (viewsData && viewsData.views) {
        const lastView = viewsData.views.find(v => v.viewerId === viewerId);
        if (lastView) {
          const last = new Date(lastView.viewedAt);
          const now = new Date();
          if (now - last < 24 * 60 * 60 * 1000) {
            canView = false;
            nextViewAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
          }
        }
      }
      
      res.json({
        viewCount: viewsData ? viewsData.viewCount : 0,
        canView,
        nextViewAt
      });
    } catch (error) {
      console.error('❌ Error getting views:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });

  app.post('/api/user/:id/view', async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user.id;
      
      const viewsData = await Views.findOne({ userId });
      let canView = true, nextViewAt = null;
      
      if (viewsData && viewsData.views) {
        const lastView = viewsData.views.find(v => v.viewerId === viewerId);
        if (lastView) {
          const last = new Date(lastView.viewedAt);
          const now = new Date();
          if (now - last < 24 * 60 * 60 * 1000) {
            canView = false;
            nextViewAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
          }
        }
      }
      
      if (!canView) {
        return res.status(429).json({ 
          success: false, 
          error: 'Просматривать можно раз в 24ч', 
          nextViewAt 
        });
      }
      
      // Добавить просмотр
      await Views.findOneAndUpdate(
        { userId },
        {
          $inc: { viewCount: 1 },
          $push: { views: { viewerId, viewedAt: new Date() } }
        },
        { upsert: true, new: true }
      );
      
      // Вернуть обновленные данные
      const updated = await Views.findOne({ userId });
      res.json({
        success: true,
        viewCount: updated.viewCount,
        canView: false,
        nextViewAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('❌ Error adding view:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
  
  console.log('✅ API routes registered successfully');
} catch (error) {
  console.error('❌ Failed to register API routes:', error);
  process.exit(1);
}

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  try {
    console.log('🔐 Authentication check for request:', req.method, req.path);
    console.log('🔐 Session ID:', req.sessionID);
    console.log('🔐 Session exists:', !!req.session);
    console.log('🔐 Session passport:', !!req.session?.passport);
    console.log('🔐 User authenticated:', req.isAuthenticated());
    console.log('🔐 User object:', req.user ? `ID: ${req.user.id}, Username: ${req.user.username}` : 'No user');
    
    // Check if session exists
    if (!req.session) {
      console.log('❌ No session found');
      return res.status(401).json({ 
        success: false, 
        error: 'No session found',
        message: 'Please login through Discord first',
        path: req.path,
        method: req.method
      });
    }
    
    // Check if passport data exists in session
    if (!req.session.passport || !req.session.passport.user) {
      console.log('❌ No passport data in session');
      return res.status(401).json({ 
        success: false, 
        error: 'No passport data in session',
        message: 'Please login through Discord first',
        path: req.path,
        method: req.method
      });
    }
    
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      console.log('❌ User not authenticated');
      return res.status(401).json({ 
        success: false, 
        error: 'Not authenticated',
        message: 'Please login through Discord first',
        path: req.path,
        method: req.method
      });
    }
    
    // Check if user object exists
    if (!req.user) {
      console.log('❌ No user object found');
      return res.status(401).json({ 
        success: false, 
        error: 'No user object found',
        message: 'Please login through Discord first',
        path: req.path,
        method: req.method
      });
    }
    
    // Validate user object
    if (!req.user.id || !req.user.username) {
      console.log('❌ Invalid user object:', req.user);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid user object',
        message: 'Please login through Discord first',
        path: req.path,
        method: req.method
      });
    }
    
    // Update session activity
    req.session.lastActivity = new Date();
    req.session.touch();
    
    console.log('✅ Authentication successful for user:', req.user.username);
    return next();
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication check failed',
      details: error.message
    });
  }
}

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Server error:', error);
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      success: false, 
      error: 'Validation error',
      details: error.message 
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid ID format' 
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({ 
      success: false, 
      error: 'Duplicate entry' 
    });
  }
  
  // Generic error response
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

console.log('✅ Middleware and error handlers configured successfully');

// Start server
try {
  const server = app.listen(PORT, () => {
    console.log('🚀 Discord Tracker Pro Server Starting...');
    console.log('📋 Environment Configuration:');
    console.log(`   - Discord Client ID: ${process.env.DISCORD_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Discord Client Secret: ${process.env.DISCORD_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Session Secret: ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:5000`);
    console.log(`🔧 Backend: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`🔐 Discord OAuth: http://localhost:${PORT}/auth/discord`);
    console.log('');
    console.log('🎉 Server is ready! You can now:');
    console.log('   1. Open http://localhost:5000 in your browser');
    console.log('   2. Click "Войти через Discord" to authenticate');
    console.log('   3. Start tracking Discord users!');
  });

  // Server error handling
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.error('💡 Please try a different port or stop the service using this port');
      console.error('💡 You can change the port in config.env by setting PORT=3001');
    } else {
      console.error('❌ Server error:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });
  
  console.log('✅ Server startup configuration completed');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
