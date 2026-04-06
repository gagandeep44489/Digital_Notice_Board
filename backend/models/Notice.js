const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Low'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  { versionKey: false }
);

module.exports = mongoose.model('Notice', noticeSchema);
