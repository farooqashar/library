var Book = require('../models/book');
var Author = require("../models/author");
var Genre = require("../models/genre");
var BookInstance = require("../models/bookinstance")
var async = require("async");
const { body,validationResult } = require('express-validator');

exports.index = function(req, res) {

    async.parallel({
        book_count: function(callback) {
            Book.countDocuments({}, callback); 
        },
        book_instance_count: function(callback) {
            BookInstance.countDocuments({}, callback);
        },
        book_instance_available_count: function(callback) {
            BookInstance.countDocuments({status:'Available'}, callback);
        },
        author_count: function(callback) {
            Author.countDocuments({}, callback);
        },
        genre_count: function(callback) {
            Genre.countDocuments({}, callback);
        }
    }, function(err, results) {
        res.render('index', { title: 'Library Home', error: err, data: results });
    });
};

exports.book_list = function(req, res, next) {
    Book.find({}, 'title author')
    .populate('author')
    .exec(function (err, results) {
        if (err) { return next(err); }
        res.render('book_list', { title: 'All Books', book_list: results });
    });
};

exports.book_detail = function(req, res, next) {

    async.parallel(
        {
        book: function(callback) {
            Book.findById(req.params.id)
            .populate('author')
            .populate('genre')
            .exec(callback);
        },
        book_instance: function(callback) {
            BookInstance.find({'book': req.params.id})
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }

        if (results.book == null){
            var err = new Error("Book Not Found.")
            err.status = 404;
            return next(err);
        }
        res.render('book_detail', { title: 'Book Details', data: results });
    });

};

exports.book_create_get = function(req, res, next) {

    async.parallel({
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('book_form', { title: 'Create Book', authors: results.authors, genres: results.genres });
    });

};

exports.book_create_post = [
    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre ==='undefined')
            req.body.genre = [];
            else
            req.body.genre = new Array(req.body.genre);
        }
        next();
    },

    body('title', 'Title Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN Must Not Be Empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: req.body.genre
           });

        if (!errors.isEmpty()) {

            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Create Book',authors:results.authors, genres:results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            book.save(function (err) {
                if (err) { return next(err); }
                   res.redirect(book.url);
                });
        }
    }
];

exports.book_delete_get = function(req, res) {
    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).exec(callback)
        },
        book_instances: function(callback) {
          BookInstance.find({ 'book': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.book==null) { 
            res.redirect('/catalog/books');
        }

        res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_instances } );
    });
};

exports.book_delete_post = function(req, res) {

    async.parallel({
        book: function(callback) {
          Book.findById(req.body.bookid).exec(callback)
        },
        book_instances: function(callback) {
          BookInstance.find({ 'book': req.body.bookid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }

        if (results.book_instances.length > 0) {
            res.render('book_delete', { title: 'Delete Book', book: results.book, book_instances: results.book_instances } );
            return;
        }
        else {
            Book.findByIdAndRemove(req.body.bookid, function deleteBook(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/books')
            })
        }
    });

};

exports.book_update_get = function(req, res, next) {

    async.parallel({
        book: function(callback) {
            Book.findById(req.params.id).populate('author').populate('genre').exec(callback);
        },
        authors: function(callback) {
            Author.find(callback);
        },
        genres: function(callback) {
            Genre.find(callback);
        },
        }, function(err, results) {
            if (err) { return next(err); }
            if (results.book==null) { 
                var err = new Error('Book Not Found');
                err.status = 404;
                return next(err);
            }
            for (var i = 0; i < results.genres.length; i++) {
                for (var j = 0; j < results.book.genre.length; j++) {
                    if (results.genres[i]._id.toString()===results.book.genre[j]._id.toString()) {
                        results.genres[i].checked='true';
                    }
                }
            }
            res.render('book_form', { title: 'Update Book', authors: results.authors, genres: results.genres, book: results.book });
        });

};

exports.book_update_post = [

    (req, res, next) => {
        if(!(req.body.genre instanceof Array)){
            if(typeof req.body.genre==='undefined')
            req.body.genre=[];
            else
            req.body.genre=new Array(req.body.genre);
        }
        next();
    },

    body('title', 'Title Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('author', 'Author Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('summary', 'Summary Must Not Be Empty.').trim().isLength({ min: 1 }).escape(),
    body('isbn', 'ISBN Must Not Be Empty').trim().isLength({ min: 1 }).escape(),
    body('genre.*').escape(),

    (req, res, next) => {

        const errors = validationResult(req);

        var book = new Book(
          { title: req.body.title,
            author: req.body.author,
            summary: req.body.summary,
            isbn: req.body.isbn,
            genre: (typeof req.body.genre==='undefined') ? [] : req.body.genre,
            _id:req.params.id 
           });

        if (!errors.isEmpty()) {

            async.parallel({
                authors: function(callback) {
                    Author.find(callback);
                },
                genres: function(callback) {
                    Genre.find(callback);
                },
            }, function(err, results) {
                if (err) { return next(err); }

                for (let i = 0; i < results.genres.length; i++) {
                    if (book.genre.indexOf(results.genres[i]._id) > -1) {
                        results.genres[i].checked='true';
                    }
                }
                res.render('book_form', { title: 'Update Book',authors: results.authors, genres: results.genres, book: book, errors: errors.array() });
            });
            return;
        }
        else {
            Book.findByIdAndUpdate(req.params.id, book, {}, function (err,results) {
                if (err) { return next(err); }
                   res.redirect(results.url);
                });
        }
    }
];
