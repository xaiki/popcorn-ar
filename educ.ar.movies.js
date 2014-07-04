(function(App) {
    'use strict';
    var Q = require('q');

    var URL = false;
    var Educar = new App.Providers.Educar();

    var EducarMovies = function() {};

    EducarMovies.prototype = Educar;
    EducarMovies.prototype.constructor = EducarMovies;

    EducarMovies.prototype.queryBase = AdvSettings.get('EducarMoviesApiEndpoint');

    var formatForPopcorn = function (items) {
        var deferred = Q.defer();

        var movies = {};
        var movieList = [];

        var promises = _.map(items, function (movie) {
            return Educar.query(queryBase + movie.id,
                                {},
                                function (movie) {
                                    var id = movie.id;

                                    var ptItem = movies[id];
                                    if(!ptItem) {
                                        var img_big = movie.icono_grande || movie.icono_mediano || movie.icono_chico;
                                        ptItem = {
                                            id:       id,
                                            imdb: id,
                                            title:      movie.titulo,
                                            year:       movie.fecha.split('-')[0],

                                            torrents: Educar.buildTorrents(movie),
                                            format: movie.formato.slice('->')[1],
                                            rating: movie.puntaje,

                                            synopsis: movie.descripcion || movie.sinopsis,

                                            image:      movie.icono_chico,
                                            backdrop:   img_big,
                                            images: {
                                                poster:     movie.icono_chico,
                                                fanart:     img_big
                                            },

                                        };
                                    }


                                    movies[id] = ptItem;
                                    return ptItem;
                                });
        });
        Q.all(promises).done(function (movies) {
            deferred.resolve ({movies: movies, hasMore: true});
        });

        return deferred.promise;
    };

    EducarMovies.prototype.extractIds = function(items) {
        return _.pluck(items.movies, 'imdb');
    };

    EducarMovies.prototype.fetch = function(filters) {
        var formatForPopcornPartial = formatForPopcorn.apply(this.queryBase)
        return this.queryTorrents(filters)
            .then(formatForPopcorn);
    };

    App.Providers.EducarMovies = EducarMovies;

})(window.App);
