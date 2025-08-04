const mongoose = require("mongoose");
const { PASSWORD_MIN_LENGTH, HTTP_CODES } = require("../config/Enum");
const validator = require("validator");
const CustomError  = require("../lib/Error");
const bcrypt = require("bcrypt");
const {DEFAULT_LANGUAGE} = require("../config");


const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: {type: String, required: true},
  passwordHash: {type: String, required: true},
  isActive: { type: Boolean, default: true },
  language: { type: String, default: DEFAULT_LANGUAGE }, 
  favorites: {
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    series: [{ type: mongoose.Schema.Types.ObjectId, ref: "Series" }]
  },
  watchlist: {
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Movie" }],
    series: [{ type: mongoose.Schema.Types.ObjectId, ref: "Series" }]
  }},{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

class Users extends mongoose.Model {
     
  static validateFieldsBeforeAuth(email, password){

    if(typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH || !validator.isEmail(email)) {
      throw new CustomError( HTTP_CODES.UNAUTHORIZED, "Invalid email or password",);
    }

    return null;

  }

  validPassword(password){

    return bcrypt.compareSync(password, this.passwordHash);
  }
}

schema.loadClass(Users);

module.exports = mongoose.model("User", schema);
