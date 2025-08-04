const mongoose = require("mongoose");

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  tmdbId: { type: Number, required: true, unique: true }
},
{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model("Genre", genreSchema);
