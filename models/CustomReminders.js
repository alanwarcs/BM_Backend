const mongoose = require('mongoose');

const customReminderSchema = new mongoose.Schema({
    businessId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Business', 
        required: true 
    }, // Reference to the Business schema
    customerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Customer', 
        required: true 
    }, // Reference to the Customer schema
    reminderType: { 
        type: String, 
        enum: ['Custom Reminder', 'EMI Reminder'], 
        required: true 
    }, // Type of reminder
    title: { 
        type: String
    }, // Title of the reminder
    message: { 
        type: String, 
        required: true 
    }, // Detailed message of the reminder
    sendVia: { 
        type: String, 
        enum: ['Email', 'SMS', 'Both'], 
        required: true 
    }, // How the reminder will be sent
    scheduleDate: { 
        type: Date, 
        required: true 
    }, // Date and time the reminder will be sent
    status: { 
        type: String, 
        enum: ['Pending', 'Sent', 'Failed'], 
        default: 'Pending' 
    }, // Status of the reminder
    createdAt: { 
        type: Date, 
        default: Date.now 
    }, // Timestamp when the reminder was created
    updatedAt: { 
        type: Date, 
        default: Date.now 
    } // Timestamp for when the reminder was last updated
});

// Automatically update the 'updatedAt' field before saving
customReminderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const CustomReminder = mongoose.model('CustomReminder', customReminderSchema);

module.exports = CustomReminder;
