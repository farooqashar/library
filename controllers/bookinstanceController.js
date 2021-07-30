var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator');

exports.bookinstance_list = function(req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, results) {
      if (err) { return next(err); }
      res.render('all_instances', { title: 'All Book Instances', all_instances: results });
    });

};

exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, results) {
      if (err) { return next(err); }
      if (results==null) { 
          var err = new Error('Book Copy Not found');
          err.status = 404;
          return next(err);
        }
      res.render('bookinstance_detail', { title: 'Copy: ' + results.book.title, data:  results});
    })

};

exports.bookinstance_create_get = function(req, res, next) {

    Book.find({},'title')
    .exec(function (err, results) {
      if (err) { return next(err); }

      res.render('bookinstance_form', {title: 'Create BookInstance', book_list: results});
    });

};

exports.bookinstance_create_post = [

    body('book', 'Book Must Be Specified').trim().isLength({ min: 1 }).escape(),
    body('imprint', 'Imprint Must Be Specified').trim().isLength({ min: 1 }).escape(),
    body('status').escape(),
    body('due_back', 'Invalid Date').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {

        const errors = validationResult(req);

        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            Book.find({},'title')
                .exec(function (err, results) {
                    if (err) { return next(err); }
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: results, selected_book: bookinstance.book._id , errors: errors.array(), bookinstance: bookinstance });
            });
            return;
        }
        else {

            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   res.redirect(bookinstance.url);
                });
        }
    }
];


exports.bookinstance_delete_get = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, results) {
        if (err) { return next(err); }
        if (results==null) {
            res.redirect('/catalog/bookinstances');
        }

        res.render('bookinstance_delete', { title: 'Delete BookInstance', data:  results});
    })

};

exports.bookinstance_delete_post = function(req, res, next) {

    BookInstance.findByIdAndRemove(req.body.bkid, function deleteBookInstance(err) {
        if (err) { return next(err); }
        res.redirect('/catalog/bookinstances');
        });

};