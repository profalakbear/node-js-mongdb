const mongoose =require('mongoose');
const {Schema} = mongoose;


const countsSchema = new Schema({
    id: Number,
    locationCode: String,
    completedCounts: [{
        totalAmount: Number,
        contents: [{ 
            barcode: String, 
            amount: Number 
        }]
    }]
});



module.exports = mongoose.model("counts", countsSchema)