const mongoose = require('mongoose');

const reputationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: Number,
    default: 0
  },
  votes: [{
    voterId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['up', 'down'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
reputationSchema.index({ userId: 1 });
reputationSchema.index({ 'votes.voterId': 1 });

module.exports = mongoose.model('Reputation', reputationSchema);
