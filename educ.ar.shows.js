(function(App) {
    'use strict';
    var Q = require('q');

    var URL = false;
    var Educar = new App.Providers.Educar();

    var EducarShows = function() {};
    EducarShows.prototype = Educar;
    EducarShows.prototype.constructor = EducarShows;

    EducarShows.prototype.queryBase = AdvSettings.get('EducarSeriesApiEndpoint');

    // Single element query
    var queryTorrent = function(show) {
        var deferred = Q.defer();

        var episodes = _.map (show.temporadas, function (season) {
            return season.capitulos;
        });

        var promises = _.map (show.temporadas, function (season, key) {
            console.log ('key', key);
            return _.map(season.capitulos, function (episode) {
                return Educar.query (AdvSettings.get('EducarShowApiEndpoint') + episode.id);
            });
        });

        Q.all(_.flatten(promises)).done(function (data) {
            show.episodes = data;
            return deferred.resolve (show);
        });
        return deferred.promise;
    };

    var querySerieDetails = function(id) {
        return Educar.query (AdvSettings.get('EducarSeriesApiEndpoint') + id);
    };

    var formatDetailForPopcorn = function (show) {
        var deferred = Q.defer();

        var id = show.id;
        var img_big = show.icono_grande || show.icono_mediano || show.icono_chico;
        var seasons = _.map (show.temporadas, function (season) {
            var episodes = _.map (season.capitulos, function (capitulo) {
                return Educar.query(AdvSettings.get('EducarShowApiEndpoint') + capitulo.id,
                            {}, function (data) {
                                var episode =  {
                                    id: data.id,
                                    imdb_id: data.id,
                                    tvdb_id: data.id,
                                    torrents: Educar.buildTorrents(data),
                                    title: capitulo.titulo,
                                    overview: data.emision.descripcion,
                                    episode: data.numero_capitulo,
                                    season: season.numero
                                };
                                return episode;
                            });
            });
            return episodes;
        });

        Q.all(_.flatten(seasons)).done(function (episodes) {
            var x = {
                id:      id,
                imdb_id: id,
                tvdb_id: id,
                title:      show.titulo,
                year:       show.fecha.split('-')[0],

                ShowRating: 4,
                synopsis: show.descripcion || show.sinopsis,

                image:      show.icono_chico,
                backdrop:   img_big,
                bigImage:   img_big,
                images: {
                    poster:     show.icono_chico,
                    fanart:     img_big,
                    banner:     img_big
                },
                //                    torrents: {'1080p' : {url: show.url}},
                runtime: show.duracion,
                region: show.region,
                country: show.country,
                rating: show.puntaje,
                genres: ['hack'],
                num_seasons: seasons.length,
                episodes: episodes
            };
            console.log (x);
            return deferred.resolve (x);
        });

        return deferred.promise;
    };

    var formatForPopcorn = function(items) {
        var deferred = Q.defer();

        var shows = {};
        var showList = [];
        var promises = {};
        _.each(items, function(show) {
             var id = show.id;

            var ptItem = shows[id];
            if(!ptItem) {
                var img_big = show.icono_grande || show.icono_mediano || show.icono_chico;


                ptItem = {
                    id:       id,
                    imdb_id: id,
                    title:      show.titulo,
                    year:       show.fecha.split('-')[0],

                    ShowRating: 4,

                        synopsis: show.descripcion || show.sinopsis,

                    image:      show.icono_chico,
                    images: {
                        poster:     show.icono_chico,
                        fanart:     img_big
                    },

                };
                showList.push(ptItem);
            }

            shows[id] = ptItem;
        });

        return showList;
    };

    EducarShows.prototype.extractIds = function(items) {
        return _.pluck(items, 'imdb_id');
    };

    EducarShows.prototype.fetch = function(filters) {
        return this.queryTorrents(filters)
//            .then(querySeriesDetails)
            .then(formatForPopcorn);
    };

    EducarShows.prototype.detail = function(torrent_id, callback) {
        return querySerieDetails(torrent_id)
            .then(queryTorrent)
            .then(formatDetailForPopcorn)
            .done(function (data) {
                return callback (null, data);
            });
    };

    App.Providers.EducarShows = EducarShows;

})(window.App);
