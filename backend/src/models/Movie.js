const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  originalTitle: String,
  overview: String,
  releaseDate: Date,
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  posterPath: String,
  backdropPath: String,
  voteAverage: Number,
  voteCount: Number,
  originalLanguage: String,
  popularity: Number,
},
{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model("Movie", movieSchema);
