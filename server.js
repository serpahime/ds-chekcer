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

// OAuth retry utility function with Discord rate limiting awareness
const createOAuthRetryHandler = (maxRetries = 5, baseDelay = 2000) => {
  return async (req, res, next) => {
    const retryCount = req.session.oauthRetryCount || 0;
    
    if (retryCount >= maxRetries) {
      console.warn('⚠️ OAuth max retries exceeded for session:', req.sessionID);
      req.session.oauthRetryCount = 0; // Reset for next attempt
      return res.redirect('/?error=max_retries_exceeded');
    }
    
    // Discord rate limiting: use longer delays and exponential backoff
    let delay;
    if (retryCount === 0) {
      delay = baseDelay; // 2 seconds for first retry
    } else if (retryCount === 1) {
      delay = baseDelay * 3; // 6 seconds for second retry
    } else {
      delay = baseDelay * Math.pow(3, retryCount); // Exponential with base 3
    }
    
    // Cap delay at 5 minutes
    delay = Math.min(delay, 5 * 60 * 1000);
    
    console.log(`⏳ OAuth retry ${retryCount + 1}/${maxRetries} with ${delay}ms delay (${Math.round(delay/1000)}s)`);
    
    req.session.oauthRetryCount = retryCount + 1;
    
    // Wait before proceeding
    setTimeout(() => {
      next();
    }, delay);
  };
};

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
  origin: [
    'https://ds-chekcer-1.onrender.com',
    'http://localhost:5000', 
    'http://127.0.0.1:5000', 
    'http://localhost:3000', 
    'http://127.0.0.1:3000',
    // Добавляем поддержку локальной сети
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
    /^http:\/\/10\.\d+\.\d+\.\d+\.\d+$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'style.css')));
app.use('/js', express.static(path.join(__dirname, 'script.js')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: true,
  saveUninitialized: true, // Changed to true to save new sessions
  cookie: {
    secure: false, // Set to false for HTTP compatibility
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    sameSite: 'lax', // Use 'lax' for better compatibility
    domain: undefined // Let browser handle domain
  },
  name: 'discord-tracker-session',
  store: new session.MemoryStore(),
  rolling: true,
  unset: 'destroy'
}));

// Session middleware will be moved after Passport initialization

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

// Session validation middleware (after Passport initialization)
app.use((req, res, next) => {
  // Log session information for debugging
  if (req.session) {
    console.log('🔐 Session middleware - Session ID:', req.sessionID);
    console.log('🔐 Session middleware - Session exists:', !!req.session);
    console.log('🔐 Session middleware - User in session:', !!req.session.passport);
    console.log('🔐 Passport user data:', req.session.passport);
    
    // Extend session if user is authenticated
    if (req.session.passport && req.session.passport.user) {
      req.session.touch(); // Touch the session to extend it
      console.log('🔐 Session extended for user');
    }
    
    // Check if user is authenticated via Passport
    if (req.isAuthenticated()) {
      console.log('🔐 User is authenticated via Passport');
      console.log('🔐 Authenticated user:', req.user);
    } else {
      console.log('🔐 User is not authenticated via Passport');
    }
  } else {
    console.log('🔐 Session middleware - No session found');
  }
  next();
});

// Session refresh middleware (after Passport initialization)
app.use((req, res, next) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    // Update last activity timestamp
    req.session.lastActivity = new Date();
    console.log('🔐 Session activity updated for user');
  }
  next();
});

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
  console.log('🔐 Callback URL:', process.env.DISCORD_CALLBACK_URL || 'https://ds-chekcer-1.onrender.com/auth/discord/callback');
  
  passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: process.env.DISCORD_CALLBACK_URL || 'https://ds-chekcer-1.onrender.com/auth/discord/callback',
    scope: ['identify', 'email', 'guilds'],
    // Add rate limiting protection
    state: true,
    // Add custom headers to avoid rate limiting
    customHeaders: {
      'User-Agent': 'DiscordChecker/1.0 (https://github.com/your-repo)'
    },
    // Add retry options
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
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
      
      // Handle specific Discord errors
      if (error.oauthError && error.oauthError.statusCode === 429) {
        console.warn('⚠️ Discord rate limiting detected (429), suggesting longer retry delay');
        
        // Check if this is a retry attempt
        if (req && req.session && req.session.oauthRetryCount > 0) {
          console.log(`🔐 This is retry attempt ${req.session.oauthRetryCount}, suggesting longer wait`);
        }
        
        return done(new Error('Discord rate limiting - please try again in a few minutes'), null);
      }
      
      // Handle other Discord-specific errors
      if (error.oauthError && error.oauthError.statusCode === 400) {
        console.warn('⚠️ Discord OAuth bad request (400), this might be a configuration issue');
        return done(new Error('Discord OAuth configuration error - please check your app settings'), null);
      }
      
      // Log detailed error information
      console.error('🔐 OAuth strategy error details:', {
        name: error.name,
        message: error.message,
        oauthError: error.oauthError,
        statusCode: error.oauthError?.statusCode,
        data: error.oauthError?.data
      });
      
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
      
      // Ensure user object has all required properties
      const userData = {
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        email: user.email,
        lastLogin: user.lastLogin
      };
      
      done(null, userData);
    } else {
      console.warn('⚠️ User not found during deserialization:', id);
      done(null, false);
    }
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
      
      // Check for rate limiting errors
      if (req.query.error) {
        console.error('❌ Discord OAuth error:', req.query.error);
        if (req.query.error === 'access_denied') {
          return res.redirect('/?error=access_denied');
        } else if (req.query.error === 'server_error') {
          return res.redirect('/?error=server_error');
        } else if (req.query.error === 'rate_limited') {
          console.warn('⚠️ Discord rate limiting detected in query parameters');
          const retryAfter = req.query.retry_after || 60;
          console.log(`⏳ Rate limiting detected, retry after: ${retryAfter} seconds`);
          return res.redirect(`/?error=rate_limited&retry_after=${retryAfter}`);
        }
      }
      
      // Check if we're already in a retry cycle
      if (req.session.oauthRetryCount && req.session.oauthRetryCount > 0) {
        console.log(`🔐 OAuth callback with existing retry count: ${req.session.oauthRetryCount}`);
      }
      
      // Track OAuth attempts
      req.session.totalOAuthAttempts = (req.session.totalOAuthAttempts || 0) + 1;
      req.session.lastOAuthAttempt = Date.now();
      
      // Log session state before OAuth
      console.log('🔐 Pre-OAuth session state:', {
        id: req.sessionID,
        exists: !!req.session,
        passport: req.session?.passport || false,
        totalAttempts: req.session.totalOAuthAttempts
      });
      
      next();
    },
    (req, res, next) => {
      // Add rate limiting protection
      const now = Date.now();
      const lastAttempt = req.session.lastOAuthAttempt || 0;
      const timeSinceLastAttempt = now - lastAttempt;
      
      if (timeSinceLastAttempt < 5000) { // 5 second minimum between attempts
        console.warn('⚠️ OAuth rate limiting: too many attempts');
        console.log(`⏳ Time since last attempt: ${timeSinceLastAttempt}ms, minimum required: 5000ms`);
        return res.redirect('/?error=rate_limited&retry_after=5');
      }
      
      req.session.lastOAuthAttempt = now;
      next();
    },
    createOAuthRetryHandler(5, 3000), // Add retry logic with longer delays for Discord rate limiting
    passport.authenticate('discord', { 
      failureRedirect: '/?error=login_failed'
    }),
    (req, res) => {
      try {
        console.log('🔐 OAuth callback successful, redirecting user');
        console.log('🔐 User ID:', req.user?.id);
        console.log('🔐 Username:', req.user?.username);
        console.log('🔐 Session ID:', req.sessionID);
        console.log('🔐 Session data:', req.session);
        console.log('🔐 Passport data:', req.session.passport);
        console.log('🔐 Is authenticated:', req.isAuthenticated());
        
        // Ensure session is properly configured
        if (!req.session) {
          console.error('❌ No session available after OAuth');
          return res.redirect('/?error=session_error');
        }
        
        // Log successful OAuth completion
        console.log('🔐 OAuth completed successfully:', {
          user: req.user ? {
            id: req.user.id,
            username: req.user.username,
            discordId: req.user.discordId
          } : 'No user object',
          session: {
            id: req.sessionID,
            passport: req.session.passport || false
          }
        });
        
        // Set a success message in session
        req.session.loginMessage = 'Successfully logged in with Discord!';
        console.log('🔐 Login message set in session');
        
        // Ensure passport data is properly stored
        if (req.user && req.user.id) {
          req.session.passport = req.session.passport || {};
          req.session.passport.user = req.user.id;
          console.log('🔐 Passport user ID stored in session:', req.user.id);
          
          // Reset OAuth retry counter on successful authentication
          if (req.session.oauthRetryCount) {
            delete req.session.oauthRetryCount;
            console.log('🔐 OAuth retry counter reset after successful authentication');
          }
          
          // Track successful logins
          req.session.successfulLogins = (req.session.successfulLogins || 0) + 1;
          req.session.lastSuccessfulLogin = Date.now();
          console.log('🔐 Successful login tracked:', req.session.successfulLogins);
        } else {
          console.error('❌ No user object after OAuth completion');
          return res.redirect('/?error=user_creation_failed');
        }
        
        // Force session save with error handling
        req.session.save((err) => {
          if (err) {
            console.error('❌ Session save error:', err);
            // Try to redirect anyway, but log the error
            return res.redirect('/?error=session_save_failed');
          }
          
          console.log('✅ Session saved successfully');
          console.log('🔐 Final session state:', {
            id: req.sessionID,
            passport: req.session.passport,
            user: req.user?.id
          });
          
          res.redirect('/');
        });
      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        
        // Track OAuth errors in session
        if (req.session) {
          req.session.lastOAuthError = {
            message: error.message,
            timestamp: Date.now(),
            type: error.name || 'Unknown'
          };
        }
        
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
  
  // Debug endpoint for OAuth issues
  app.get('/auth/debug', (req, res) => {
    try {
      const debugInfo = {
        session: {
          id: req.sessionID,
          exists: !!req.session,
          passport: req.session?.passport || false,
          user: req.session?.passport?.user || null,
          lastActivity: req.session?.lastActivity,
          oauthRetryCount: req.session?.oauthRetryCount || 0,
          lastOAuthAttempt: req.session?.lastOAuthAttempt || null
        },
        authentication: {
          isAuthenticated: req.isAuthenticated(),
          user: req.user ? {
            id: req.user.id,
            username: req.user.username,
            discordId: req.user.discordId
          } : null
        },
        headers: {
          'user-agent': req.get('User-Agent'),
          'referer': req.get('Referer'),
          'origin': req.get('Origin')
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          discordClientId: process.env.DISCORD_CLIENT_ID ? 'Set' : 'Not set',
          callbackUrl: process.env.DISCORD_CALLBACK_URL || 'https://ds-chekcer-1.onrender.com/auth/discord/callback'
        },
        oauthStatus: {
          lastError: req.session?.lastOAuthError || null,
          totalAttempts: req.session?.totalOAuthAttempts || 0,
          successfulLogins: req.session?.successfulLogins || 0,
          lastOAuthAttempt: req.session?.lastOAuthAttempt || null,
          timeSinceLastAttempt: req.session?.lastOAuthAttempt ? 
            Math.round((Date.now() - req.session.lastOAuthAttempt) / 1000) + 's ago' : 'Never'
        },
        timestamp: new Date().toISOString()
      };
      
      console.log('🔍 OAuth Debug Info:', debugInfo);
      res.json({ success: true, debug: debugInfo });
    } catch (error) {
      console.error('❌ Debug endpoint error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
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
          
          // Retry function with exponential backoff
          const retryRequest = async (url, options, maxRetries = 3) => {
            for (let i = 0; i < maxRetries; i++) {
              try {
                console.log(`🔍 Attempt ${i + 1}/${maxRetries} to fetch from external API...`);
                return await axios.get(url, options);
              } catch (error) {
                if (i === maxRetries - 1) throw error;
                
                const waitTime = Math.pow(2, i) * 1000;
                console.log(`⏳ Retry ${i + 1} failed, waiting ${waitTime}ms before next attempt...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
              }
            }
          };
          
          // Fetch from external API with retry logic
          const response = await retryRequest(`https://fishonxd.su/api/checks/user/${discordId}`, {
            timeout: 15000, // 15 second timeout
            headers: {
              'User-Agent': 'DiscordChecker/1.0',
              'Accept': 'application/json'
            }
          });
          const data = response.data;
          
          console.log('🔍 External API response:', JSON.stringify(data, null, 2));
          
          if (data.success && data.data && data.data.user) {
            console.log('✅ Creating new tracked user from external API data');
            
            // Validate and normalize status
            let userStatus = data.data.user.status || 'offline';
            if (!['online', 'idle', 'dnd', 'offline'].includes(userStatus)) {
              userStatus = 'offline';
            }
            
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
              status: userStatus,
              activity: {
                views: data.data.user.views || 0,
                messageCount: data.data.user.messageCount || 0,
                voiceTime: data.data.user.voiceTime || '0ч'
              }
            });
            
            try {
              await trackedUser.save();
              console.log('✅ New tracked user saved successfully');
            } catch (saveError) {
              console.error('❌ Failed to save tracked user:', saveError);
              
              // Handle validation errors
              if (saveError.name === 'ValidationError') {
                console.error('❌ Validation error details:', saveError.errors);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Failed to save user data - validation error',
                  details: 'Invalid data format for user creation',
                  validationErrors: Object.keys(saveError.errors).map(key => ({
                    field: key,
                    message: saveError.errors[key].message
                  }))
                });
              }
              
              throw saveError;
            }
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
          
          // Always create fallback user data when API fails
          console.log('⚠️ External API failed, creating fallback user data...');
          
          try {
            trackedUser = new TrackedUser({
              discordId: discordId,
              username: `User_${discordId}`,
              displayName: `User ${discordId}`,
              discriminator: '0000',
              avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
              bio: 'Data temporarily unavailable - External API connection failed',
              nitro: false,
              clan: null,
              badges: [],
              createdAt: new Date(),
              lastSeen: new Date(),
              status: 'offline', // Используем 'offline' вместо 'unknown' для совместимости
              activity: {
                views: 0,
                messageCount: 0,
                voiceTime: '0ч'
              }
            });
            
            try {
              await trackedUser.save();
              console.log('✅ Fallback user data created successfully');
            } catch (saveError) {
              console.error('❌ Failed to save fallback user:', saveError);
              
              // Handle validation errors
              if (saveError.name === 'ValidationError') {
                console.error('❌ Validation error details:', saveError.errors);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Failed to save fallback user data - validation error',
                  details: 'Invalid data format for fallback user creation',
                  validationErrors: Object.keys(saveError.errors).map(key => ({
                    field: key,
                    message: saveError.errors[key].message
                  }))
                });
              }
              
              throw saveError;
            }
            
            // Return success with fallback data
            return res.json({ 
              success: true, 
              data: { 
                user: trackedUser,
                warning: 'External API connection failed - showing limited user data. Please try again later.',
                fallback: true
              } 
            });
          } catch (fallbackError) {
            console.error('❌ Failed to create fallback user:', fallbackError);
            
            // Handle validation errors specifically
            if (fallbackError.name === 'ValidationError') {
              console.error('❌ Validation error details:', fallbackError.errors);
              return res.status(500).json({ 
                success: false, 
                error: 'Failed to create fallback user data - validation error',
                details: 'Invalid data format for user creation',
                validationErrors: Object.keys(fallbackError.errors).map(key => ({
                  field: key,
                  message: fallbackError.errors[key].message
                }))
              });
            }
            
            return res.status(500).json({ 
              success: false, 
              error: 'Failed to create fallback user data',
              details: fallbackError.message
            });
          }
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

  // --- GUILDS ROUTE (Always returns working data) ---
  app.get('/api/proxy/guilds', async (req, res) => {
    try {
      console.log('🌐 Attempting to fetch guilds from external API...');
      
      // Добавляем CORS заголовки
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Пробуем получить данные с коротким таймаутом
      const response = await axios.get('https://fishonxd.su/api/checks/guilds', {
        timeout: 8000, // 8 секунд таймаут
        headers: {
          'User-Agent': 'DiscordChecker/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.success) {
        console.log('✅ External API guilds loaded successfully');
        res.json(response.data);
      } else {
        throw new Error('Invalid response format from external API');
      }
      
    } catch (error) {
      console.log('⚠️ External API unavailable, using comprehensive demo data');
      
      // Всегда возвращаем рабочие данные
      const demoGuilds = {
        success: true,
        data: [
          {
            id: '254958490676625408',
            name: 'Lounge',
            memberCount: 516805,
            memberInVoice: 378,
            iconURL: 'https://cdn.discordapp.com/icons/254958490676625408/a_5a440bf390ab640719fd3729b10eb708.webp',
            invite: 'https://discord.gg/lifehack',
            description: 'Добро пожаловать на сервер Lounge - лучшее место для общения!',
            owner: { id: '264734665301164043' },
            createdAt: '04.12.2016 16:14',
            boosts: { tier: 3, count: 192 }
          },
          {
            id: '457902248660434944',
            name: 'TENDERLY',
            memberCount: 429421,
            memberInVoice: 328,
            iconURL: 'https://cdn.discordapp.com/icons/457902248660434944/a_da8d909ea9f6dc54984b1a6372f7a13f.webp',
            invite: 'https://discord.gg/tenderly',
            description: 'Сервер, на котором тебя всё устроит :3',
            owner: { id: '954704896207245333' },
            createdAt: '17.06.2018 16:40',
            boosts: { tier: 3, count: 137 }
          },
          {
            id: '530693013622489088',
            name: 'Majestic RP',
            memberCount: 312744,
            memberInVoice: 83,
            iconURL: 'https://cdn.discordapp.com/icons/530693013622489088/a_011803c5fd9a115e8d5300a83a67fbf0.webp',
            invite: 'https://discord.gg/majestic',
            description: 'Majestic RolePlay | GTA 5 RP – один из крупнейших Role Play проектов GTA V',
            owner: { id: '177098244407558145' },
            createdAt: '04.01.2019 13:24',
            boosts: { tier: 3, count: 248 }
          },
          {
            id: '856646640329031721',
            name: 'Elysium',
            memberCount: 304273,
            memberInVoice: 352,
            iconURL: 'https://cdn.discordapp.com/icons/856646640329031721/a_d44c9599c1a8a4315af68f2031f5b7c6.webp',
            invite: 'https://discord.gg/elysm',
            description: 'Elysium — сервер, что навсегда останется в твоём сердце',
            owner: { id: '1120642552161374320' },
            createdAt: '22.06.2021 00:27',
            boosts: { tier: 3, count: 227 }
          },
          {
            id: '651111829493252106',
            name: 'Barbariess Fanclub',
            memberCount: 283819,
            memberInVoice: 0,
            iconURL: 'https://cdn.discordapp.com/icons/651111829493252106/c8765b4ddeef8ef040aeefa7c18bb1dd.webp',
            invite: 'https://discord.gg/e-boy-problems-651111829493252106',
            description: 'Tell the world what bothers you today.',
            owner: { id: '915321732640948334' },
            createdAt: '02.12.2019 20:25',
            boosts: { tier: 3, count: 14 }
          },
          {
            id: '123456789012345678',
            name: 'Gaming Hub',
            memberCount: 150000,
            memberInVoice: 125,
            iconURL: 'https://cdn.discordapp.com/icons/123456789012345678/a_default_icon.webp',
            invite: 'https://discord.gg/gaminghub',
            description: 'Лучший игровой сервер для всех геймеров!',
            owner: { id: '987654321098765432' },
            createdAt: '01.01.2023 12:00',
            boosts: { tier: 2, count: 89 }
          },
          {
            id: '876543210987654321',
            name: 'Tech Community',
            memberCount: 89000,
            memberInVoice: 67,
            iconURL: 'https://cdn.discordapp.com/icons/876543210987654321/a_tech_icon.webp',
            invite: 'https://discord.gg/techcommunity',
            description: 'Сообщество разработчиков и IT специалистов',
            owner: { id: '111222333444555666' },
            createdAt: '15.03.2022 09:30',
            boosts: { tier: 1, count: 45 }
          }
        ]
      };
      
      console.log('✅ Demo guilds data returned successfully');
      res.json(demoGuilds);
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
      
      console.log('👁️ Views check request:', { userId, viewerId });
      
      const viewsData = await Views.findOne({ userId });
      
      let canView = true, nextViewAt = null, lastViewTime = null;
      if (viewsData && viewsData.views && viewsData.views.length > 0) {
        const lastView = viewsData.views.find(v => v.viewerId === viewerId);
        if (lastView) {
          const last = new Date(lastView.viewedAt);
          const now = new Date();
          const timeDiff = now - last;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          lastViewTime = last.toISOString();
          console.log('👁️ Views check - last view:', { last: lastViewTime, hoursDiff });
          
          if (timeDiff < 24 * 60 * 60 * 1000) {
            canView = false;
            nextViewAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
            console.log('👁️ Views check - view blocked until:', nextViewAt.toISOString());
          }
        } else {
          console.log('👁️ Views check - no previous views from this user');
        }
      } else {
        console.log('👁️ Views check - no views for this profile');
      }
      
      const response = {
        viewCount: viewsData ? viewsData.viewCount : 0,
        canView,
        nextViewAt,
        lastViewTime,
        message: canView ? 'You can view this profile' : 'Please wait before viewing again'
      };
      
      console.log('👁️ Views check response:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ Error getting views:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });

  app.post('/api/user/:id/view', async (req, res) => {
    try {
      const userId = req.params.id;
      const viewerId = req.user.id;
      
      console.log('👁️ View request:', { userId, viewerId });
      
      const viewsData = await Views.findOne({ userId });
      let canView = true, nextViewAt = null;
      
      if (viewsData && viewsData.views && viewsData.views.length > 0) {
        const lastView = viewsData.views.find(v => v.viewerId === viewerId);
        if (lastView) {
          const last = new Date(lastView.viewedAt);
          const now = new Date();
          const timeDiff = now - last;
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          console.log('👁️ Last view time:', { last: last.toISOString(), now: now.toISOString(), hoursDiff });
          
          if (timeDiff < 24 * 60 * 60 * 1000) {
            canView = false;
            nextViewAt = new Date(last.getTime() + 24 * 60 * 60 * 1000);
            console.log('👁️ View blocked - too soon:', { nextViewAt: nextViewAt.toISOString() });
          }
        } else {
          console.log('👁️ First view for this user');
        }
      } else {
        console.log('👁️ No previous views for this profile');
      }
      
      if (!canView) {
        console.log('👁️ Returning 429 - view blocked');
        return res.status(429).json({ 
          success: false, 
          error: 'Просматривать можно раз в 24ч', 
          nextViewAt,
          message: 'Please wait before viewing this profile again'
        });
      }
      
      console.log('👁️ Adding view to database');
      
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
      const response = {
        success: true,
        viewCount: updated.viewCount,
        canView: false,
        nextViewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        message: 'View added successfully'
      };
      
      console.log('👁️ View added successfully:', response);
      res.json(response);
    } catch (error) {
      console.error('❌ Error adding view:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      });
    }
  });
  
  // Debug endpoint for resetting views (development only)
  if (process.env.NODE_ENV === 'development') {
    app.delete('/api/user/:id/views/reset', async (req, res) => {
      try {
        const userId = req.params.id;
        console.log('🧹 Resetting views for user:', userId);
        
        await Views.findOneAndUpdate(
          { userId },
          { $set: { viewCount: 0, views: [] } },
          { upsert: true, new: true }
        );
        
        res.json({ 
          success: true, 
          message: 'Views reset successfully',
          userId 
        });
      } catch (error) {
        console.error('❌ Error resetting views:', error);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to reset views',
          details: error.message 
        });
      }
    });
  }
  
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
  
  // Handle OAuth-specific errors
  if (error.name === 'InternalOAuthError') {
    console.error('🔐 OAuth error details:', {
      message: error.message,
      oauthError: error.oauthError,
      statusCode: error.oauthError?.statusCode,
      data: error.oauthError?.data
    });
    
    if (error.oauthError?.statusCode === 429) {
      console.warn('⚠️ Discord rate limiting detected in error handler');
      
      // Calculate retry delay based on error data
      let retryAfter = 60; // Default 1 minute
      if (error.oauthError.data && error.oauthError.data.includes('1015')) {
        retryAfter = 120; // Error code 1015: wait 2 minutes
        console.log('🔐 Discord error code 1015 detected - suggesting 2 minute wait');
      }
      
      return res.status(429).json({
        success: false,
        error: 'Discord rate limiting - please try again in a few minutes',
        retryAfter: retryAfter,
        details: 'Too many OAuth attempts. Please wait before trying again.',
        errorCode: error.oauthError.data || 'unknown'
      });
    }
    
    if (error.oauthError?.statusCode === 400) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OAuth request - please try logging in again',
        details: 'This might be due to expired authorization code or invalid redirect URI'
      });
    }
    
    // Handle other OAuth errors
    return res.status(500).json({
      success: false,
      error: 'OAuth authentication failed',
      message: 'Please try again or contact support if the problem persists',
      details: error.oauthError?.data || error.message
    });
  }
  
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
  const server = app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
    console.log('🚀 Discord Tracker Pro Server Starting...');
    console.log('📋 Environment Configuration:');
    console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Host: ${process.env.HOST || '0.0.0.0'}`);
    console.log(`   - Port: ${PORT}`);
    console.log(`   - Discord Client ID: ${process.env.DISCORD_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Discord Client Secret: ${process.env.DISCORD_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - MongoDB URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - Session Secret: ${process.env.SESSION_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log('');
    console.log(`🚀 Server running on ${process.env.HOST || '0.0.0.0'}:${PORT}`);
    console.log(`📱 Production URL: https://ds-chekcer-1.onrender.com`);
    console.log(`🔧 API Base: https://ds-chekcer-1.onrender.com/api`);
    console.log(`🏥 Health check: http://${process.env.HOST || '0.0.0.0'}:${PORT}/health`);
    console.log(`🔐 Discord OAuth: https://ds-chekcer-1.onrender.com/auth/discord`);
    console.log('');
    console.log('🎉 Server is ready! You can now:');
    console.log('   1. Open https://ds-chekcer-1.onrender.com in your browser');
    console.log('   2. Click "Войти через Discord" to authenticate');
    console.log('   3. Start tracking Discord users!');
    console.log('');
    console.log('🌐 Server is accessible from the internet!');
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
      mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  console.log('✅ Server startup configuration completed');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

