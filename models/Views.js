const mongoose = require('mongoose');

const viewsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  views: [{
    viewerId: {
      type: String,
      required: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
viewsSchema.index({ userId: 1 });
viewsSchema.index({ 'views.viewerId': 1 });
viewsSchema.index({ 'views.viewedAt': 1 });

module.exports = mongoose.model('Views', viewsSchema);
