const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  tvShow: { type: mongoose.Schema.Types.ObjectId, ref: 'Series', required: true },
  seasonNumber: { type: Number, required: true },
  name: String,
  overview: String,
  airDate: Date,
  posterPath: String,
  episodeCount: Number,
},
{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Season', seasonSchema);
