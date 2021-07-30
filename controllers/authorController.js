var Author = require("../models/author");
var Book = require("../models/book");
var async = require("async");
const { body,validationResult } = require('express-validator');

exports.all_authors = function(req,res) {
    Author.find()
    .sort([['family_name','ascending']])
    .exec(function (err,results) {
        if (err) { return next(err); }
        res.render("all_authors", {title: "All Authors", all_authors:results});
    });
};

exports.author_detail = function(req,res, next) {

    async.parallel(
        {
        author: function(callback) {
            Author.findById(req.params.id)
            .exec(callback);
        },
        author_books: function(callback) {
            Book.find({'author': req.params.id}, 'title summary')
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }

        if (results.author == null){
            var err = new Error("Author Not Found.")
            err.status = 404;
            return next(err);
        }
        res.render('author_detail', { title: 'Author Details', data: results });
    });

};

exports.author_create_get = function(req, res, next) {
    res.render('author_form', { title: 'Create Author'});
};

exports.author_create_post = [

    body('first_name').trim().isLength({ min: 1 }).escape().withMessage('First Name Must Be Specified.')
        .isAlphanumeric().withMessage('First Name Has Non-alphanumeric Characters.'),
    body('family_name').trim().isLength({ min: 1 }).escape().withMessage('Family Name Must Be Specified.')
        .isAlphanumeric().withMessage('Family Name Has Non-alphanumeric Characters.'),
    body('date_of_birth', 'Invalid Date of Birth').optional({ checkFalsy: true }).isISO8601().toDate(),
    body('date_of_death', 'Invalid Date of Death').optional({ checkFalsy: true }).isISO8601().toDate(),

    (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
            return;
        }
        else {

            var author = new Author(
                {
                    first_name: req.body.first_name,
                    family_name: req.body.family_name,
                    date_of_birth: req.body.date_of_birth,
                    date_of_death: req.body.date_of_death
                });
            author.save(function (err) {
                if (err) { return next(err); }
                res.redirect(author.url);
            });
        }
    }
];

exports.author_delete_post = function(req, res, next) {

    async.parallel({
        author: function(callback) {
          Author.findById(req.body.authorid).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.body.authorid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }

        if (results.authors_books.length > 0) {
            res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
            return;
        }
        else {
            Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/authors')
            })
        }
    });
};

exports.author_delete_get = function(req, res, next) {

    async.parallel({
        author: function(callback) {
            Author.findById(req.params.id).exec(callback)
        },
        authors_books: function(callback) {
          Book.find({ 'author': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.author==null) { 
            res.redirect('/catalog/authors');
        }

        res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
    });
};


