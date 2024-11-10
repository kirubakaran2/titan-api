const { Schema, model } = require("mongoose");

const MeasurementSchema = new Schema({
    ID: Number,
    height: {
        type: Number,default: null,
    },
    chest: {
        type: Number,default: null, 
    },
    weight: {
        type: Number,default: null, 
    },
    shoulder: {
        type: Number,default: null, 
    },
    biceps: {
        type: Number,default: null, 
    },
    hip: {
        type: Number,default: null, 
    },
    leg: {
        type: Number,default: null, 
    },
    date: {
        type: Date,default: Date.now, 
    },
}, {
    timestamps: true, 
});

const Measurement = model('Measurement', MeasurementSchema);
module.exports = Measurement;
