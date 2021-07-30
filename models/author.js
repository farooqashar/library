var mongoose = require('mongoose');
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var authorSchema = new Schema(
  {
    first_name: {type: String, required: true, maxLength: 110},
    family_name: {type: String, required: true, maxLength: 110},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Full Name
authorSchema
.virtual('name')
.get(function () {
  return this.family_name + ', ' + this.first_name;
});

// Lifespan
authorSchema.virtual('lifespan').get(function() {
  var str = '';
  if (this.date_of_birth) {
    str = DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED);
  }
  str += ' - ';
  if (this.date_of_death) {
    str += DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
  }
  return str;
});

// URL
authorSchema
.virtual('url')
.get(function () {
  return '/catalog/author/' + this._id;
});


module.exports = mongoose.model('Author', authorSchema);