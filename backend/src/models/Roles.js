const mongoose = require('mongoose');

const schema = mongoose.Schema({
    name: {type: String, required: true, unique: true},
    is_active: {type: Boolean, default: true},
    created_by: {
        type : mongoose.Schema.Types.ObjectId,
        required: false,
    }
},{
    versionKey: false,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
})

class Roles extends mongoose.Model {

}

schema.loadClass(Roles);
module.exports = mongoose.model('roles', schema);