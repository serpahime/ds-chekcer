const mongoose = require('mongoose');

const trackedUserSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true
  },
  displayName: String,
  discriminator: String,
  avatar: String,
  banner: String,
  bio: String,
  nitro: {
    type: Boolean,
    default: false
  },
  clan: {
    id: String,
    name: String,
    tag: String,
    badge: String
  },
  badges: [String],
  createdAt: Date,
  lastSeen: Date,
  status: {
    type: String,
    enum: ['online', 'idle', 'dnd', 'offline'],
    default: 'offline'
  },
  // Activity data
  activity: {
    views: {
      type: Number,
      default: 0
    },
    messageCount: {
      type: Number,
      default: 0
    },
    voiceTime: {
      type: String,
      default: '0ч'
    },
    lastMessage: Date,
    lastVoice: Date
  },
  // Risk assessment
  riskAssessment: {
    score: {
      type: Number,
      default: 0
    },
    factors: [{
      factor: String,
      weight: Number,
      description: String
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  // History tracking
  history: {
    usernames: [{
      username: String,
      changedAt: Date
    }],
    avatars: [{
      url: String,
      changedAt: Date
    }],
    statuses: [{
      status: String,
      changedAt: Date
    }]
  },
  // Server activity
  servers: [{
    id: String,
    name: String,
    icon: String,
    joinedAt: Date,
    lastActive: Date
  }],
  // Tracking metadata
  trackedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    notes: String,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  lastChecked: {
    type: Date,
    default: Date.now
  },
  checkCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
trackedUserSchema.index({ discordId: 1 });
trackedUserSchema.index({ username: 1 });
trackedUserSchema.index({ 'trackedBy.userId': 1 });
trackedUserSchema.index({ lastChecked: 1 });

module.exports = mongoose.model('TrackedUser', trackedUserSchema);
