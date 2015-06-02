'use strict';
var querystring = require('querystring');
var request = require('request');
var Q = require('q');

var URL = false;
var Educar = function(queryBase) {
    this.queryBase = queryBase || 'Not Set';
};

Educar.prototype.constructor = Educar;

Educar.prototype.settings = {
        ApiKey : '254e39010ccee6734ba32bbbd563e27a9fe8118e',
        SeriesApiEndpoint : 'https://api.educ.ar/0.9/canales/encuentro/series/',
        ShowApiEndpoint : 'https://api.educ.ar/0.9/canales/encuentro/capitulos/'
};


/*
 * We'll be making a lot of these, better cache the code only once, all
 * bugs should live here.
 */
Educar.prototype.query = function (url, params, format) {
    var deferred = Q.defer();

    format = format || function (data) {return data;};
    params = params || {};
    _.extend(params, {key : AdvSettings.get('EducarApiKey')});

    url += '?' +  querystring.stringify(params).replace(/%25%20/g,'%20');
    console.error ('request to educar');
    win.debug(url);
    request({url: url, json: true}, function(error, response, data) {
        if(error) {
            deferred.reject(error);
        } else if(!data || (data.error && data.error !== 'No shows found')) {
            var err = data? data.error: 'No data returned';
            win.error('API error:', err);
            deferred.reject(err);
        } else {
            var ret = format(data.result || []);
            //    win.debug (url, ret);
            deferred.resolve(ret);
        }
    });

    return deferred.promise;
};

Educar.prototype.queryTorrents = function(filters) {
    return this.query (this.queryBase,
                       this.filtersToParams (filters),
                       function (data) { /* format data */
                           return data.data;
                       });
};


Educar.prototype.filtersToParams = function (filters) {
    var params = {};
    params.limit = '100';

    if (filters.keywords) {
        params.keywords = filters.keywords.replace(/\s/g, '% ');
    }

    if (filters.genre) {
        params.genre = filters.genre;
    }

    if (filters.order) {
        params.order = filters.order;
    }

    if (filters.sorter && filters.sorter !== 'popularity') {
        params.sort = filters.sorter;
    }

    if (filters.page) {
        params.offset = filters.page;
    }

    return params;
};

Educar.prototype.buildTorrents = function (movie) {
    var torrents = {};
    if (movie.streaming.mobile) {
        torrents['0'] = {url: movie.streaming.mobile};
    }

    if (movie.streaming.sd) {
        torrents['480p'] = {url: movie.streaming.sd};
    }

    if (movie.streaming.hd) {
        torrents['720p'] = {url: movie.streaming.hd};
    }

    return torrents;
};


exports = module.exports = function(base) {
    return new Educar(base);
};

