const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  season: { type: mongoose.Schema.Types.ObjectId, ref: 'Season', required: true },
  episodeNumber: { type: Number, required: true },
  name: String,
  overview: String,
  airDate: Date,
  stillPath: String,
  voteAverage: Number,
  voteCount: Number,
},
{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Episode', episodeSchema);
