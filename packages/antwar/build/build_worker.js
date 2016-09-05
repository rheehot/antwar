/* eslint-disable no-console */
const _fs = require('fs');
const _path = require('path');

const async = require('async');
const mkdirp = require('mkdirp');

const utils = require('./utils');

const cwd = process.cwd();

module.exports = function (o, cb) {
  if (o.task === 'copy_assets') {
    utils.copyIfExists.apply(null, o.params.concat([cb]));
  } else if (o.task === 'copy_extra_assets') {
    utils.copyExtraAssets.apply(null, o.params.concat([cb]));
  } else if (o.task === 'write') {
    write(o.params, cb);
  } else if (o.task === 'write_pages') {
    writePages(o.params, cb);
  } else if (o.task === 'write_redirects') {
    writeRedirects(o.params, cb);
  } else {
    cb();
  }
};

function writePages(params, finalCb) {
  const renderPage = require(_path.join(cwd, './.antwar/build/bundleStaticPage.js'));

  async.each(params.pages, function (page, cb) {
    // XXX: why page can be null?
    if (page) {
      // TODO: use user defined logger instead
      console.log('Starting to write page', page.page);

      renderPage(page.page, function (err, html) {
        if (err) {
          return cb(err);
        }

        return write({
          path: page.path,
          data: html
        }, function (err2) {
          if (err2) {
            return cb(err2);
          }

          // TODO: use user defined logger instead
          console.log('Finished writing page', page.page);

          return cb();
        });
      });
    } else {
      cb();
    }
  }, finalCb);
}

function writeRedirects(params, finalCb) {
  async.each(params.redirects, function (redirect, cb) {
    const from = redirect.from;
    const to = redirect.to;

    console.log('Writing redirect', from, to);

    mkdirp(from, function (err) {
      if (err) {
        return cb(err);
      }

      return write({
        path: _path.join(from, 'index.html'),
        data: '<meta http-equiv="refresh" content="0; url=' +
          to + '">\n<link rel="canonical" href="' + to + '" />'
      }, cb);
    });
  }, finalCb);
}

function write(params, cb) {
  _fs.writeFile(params.path, params.data, cb);
}
