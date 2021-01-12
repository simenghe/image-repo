import mongoose from 'mongoose';

// Schema for a public 
const publicImageSchema = new mongoose.Schema({
    id: String,
    name: String,
    url: String,
    uid: String,
})

export default mongoose.model('publicimage', publicImageSchema);