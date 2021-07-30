var mongoose = require("mongoose");
const { DateTime } = require("luxon");

var Schema = mongoose.Schema;

var bookInstanceSchema = new Schema(
    {
        book: {type: Schema.Types.ObjectId, ref: "Book", required: true},
        imprint: {type: String, required: true},
        status: {type: String, enum:['Available', 'Maintenance', 'Loaned', 'Reserved'], default: "Maintenance", required: true},
        due_back: {type: Date, default: Date.now}
    }
);

// URL
bookInstanceSchema
.virtual('url')
.get(function () {
  return '/catalog/bookinstance/' + this._id;
});

bookInstanceSchema
.virtual('due_date')
.get(function () {
    return DateTime.fromJSDate(this.due_back).toLocaleString(DateTime.DATE_MED);
});

module.exports = mongoose.model("BookInstance",bookInstanceSchema);
