const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    staffId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Staff', 
        required: true 
    }, // Reference to the Staff schema
    eventType: { 
        type: String, 
        enum: ['Plan Expiry', 'User Login', 'Settings Change', 'Payment Due'], 
        required: true 
    }, // Type of event that triggered the notification
    message: { 
        type: String, 
        required: true 
    }, // Notification message
    isRead: { 
        type: Boolean, 
        default: false 
    }, // Whether the notification has been read
    relatedData: { 
        type: Object 
    }, // Any related data like order ID, plan ID, etc.
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp for when the notification was created
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // Timestamp for when the notification was last updated
});

// Automatically update the 'updatedAt' field before saving
notificationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
