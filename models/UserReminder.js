const mongoose = require('mongoose');

const reminderNotificationSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    reminderType: { 
        type: String, 
        enum: ['General', 'Private', 'Selected'], 
        required: true 
    }, // Type of reminder
    title: { 
        type: String, 
    }, // Title of the reminder
    description: { 
        type: String 
    }, // Description of the reminder
    startDateTime: { 
        type: Date, 
        required: true 
    }, // Start date and time for the reminder
    endDateTime: { 
        type: Date 
    }, // End date and time (if applicable)
    repeatFrequency: { 
        type: String, 
        enum: ['None', 'Daily', 'Weekly', 'Monthly', 'Yearly'], 
        default: 'None' 
    }, // Reminder repetition frequency
    reminderTime: { 
        type: Date 
    }, // The specific time the reminder should be triggered
    status: { 
        type: String, 
        enum: ['Pending', 'Completed', 'Missed'], 
        default: 'Pending' 
    }, // Status of the reminder
    notificationMethod: { 
        type: String, 
        enum: ['Email', 'SMS', 'In-App'], 
        required: true 
    }, // How the reminder will be sent
    selectedStaff: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: function() {
            return this.reminderType === 'Selected';
        }
    }], // Selected users for 'Selected' type reminders
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp for when the reminder was created
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // Timestamp for when the reminder was last updated
});

// Automatically update the 'updatedAt' field before saving
reminderNotificationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const ReminderNotification = mongoose.model('ReminderNotification', reminderNotificationSchema);

module.exports = ReminderNotification;
