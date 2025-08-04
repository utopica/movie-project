const mongoose = require("mongoose");

const seriesSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  originalTitle: String,
  overview: String,
  firstAirDate: Date,
  genres: [{ type: mongoose.Schema.Types.ObjectId, ref: "Genre" }],
  posterPath: String,
  backdropPath: String,
  voteAverage: Number,
  voteCount: Number,
  originalLanguage: String,
  originCountry: [String],
  popularity: Number,
},{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model("Series", seriesSchema);
