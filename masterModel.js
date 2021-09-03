const mongoose =require('mongoose');
const {Schema} = mongoose;

const masterSchema = new Schema({
    barcode: String,
    sku: String,
    "urun adi": String
});



module.exports = mongoose.model("masters", masterSchema)