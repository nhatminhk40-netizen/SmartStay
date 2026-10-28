const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: [
            'system',
            'pass_confirmed',
            'pass_rejected',
            'pass_reservation',
            'pass_reservation_accepted',
            'pass_reservation_rejected',
            'pass_reported',
            'pass_expired'
        ],
        default: 'system'
    },
    referenceId: {
        type: String,
        default: ''
    },
    link: {
        type: String,
        default: ''
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
