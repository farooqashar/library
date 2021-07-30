var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require("express-validator");


exports.all_genres = function(req, res) {
    Genre.find()
    .sort([['name','ascending']])
    .exec(function (err,results) {
        if (err) { return next(err); }
        res.render("all_genres", {title: "All Genres", all_genres :results});
    });
};

exports.genre_detail = function(req, res, next) {

    async.parallel(
        {
        genre: function(callback) {
            Genre.findById(req.params.id)
            .exec(callback);
        },
        genre_books: function(callback) {
            Book.find({'genre': req.params.id})
            .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }

        if (results.genre == null){
            var err = new Error("Genre Not Found.")
            err.status = 404;
            return next(err);
        }
        res.render('genre_detail', { title: 'Genre Details', data: results });
    });
};

exports.genre_create_get = function(req, res, next) {
  res.render('genre_form', { title: 'Create Genre' });
};

exports.genre_create_post =  [

  body('name', 'Genre Name Required').trim().isLength({ min: 1 }).escape(),

  (req, res, next) => {

    const errors = validationResult(req);

    var genre = new Genre(
      { name: req.body.name }
    );

    if (!errors.isEmpty()) {
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
      return;
    }
    else {

      Genre.findOne({ 'name': req.body.name })
        .exec( function(err, results) {
           if (err) { return next(err); }

           if (results) {
             res.redirect(results.url);
           }
           else {

             genre.save(function (err) {
               if (err) { return next(err); }
               res.redirect(genre.url);
             });
           }
         });
    }
  }
];


exports.genre_delete_get = function(req, res) {

    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre': req.params.id }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre==null) { 
            res.redirect('/catalog/genres');
        }

        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
    });

};

exports.genre_delete_post = function(req, res) {

    async.parallel({
        genre: function(callback) {
          Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: function(callback) {
          Book.find({ 'genre': req.body.genreid }).exec(callback)
        },
    }, function(err, results) {
        if (err) { return next(err); }

        if (results.genre_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
            return;
        }
        else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err) { return next(err); }
                res.redirect('/catalog/genres')
            })
        }
    });

};
