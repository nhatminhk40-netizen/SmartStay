const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    appointmentCode: {
        type: String,
        required: true,
        unique: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    roomTitle: { type: String, default: '' },
    studentName: { type: String, required: true },
    studentPhone: { type: String, required: true },
    landlordPhone: { type: String, default: '' },
    visitDate: { type: String, required: true }, // YYYY-MM-DD
    visitTime: { type: String, required: true }, // HH:mm
    transportType: { type: String, default: 'Xe máy' },
    notes: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending_landlord', 'confirmed', 'rescheduled', 'cancelled', 'completed'],
        default: 'pending_landlord'
    },
    landlordResponseNote: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
