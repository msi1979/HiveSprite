!(function () {
  var global = this;
  var MODULE_CACHES = {};
  var SHIM = {};
  var _w = '_wrapped';

  function normpath(path) {
    while (path.indexOf('/../') !== -1) {
      path = path.replace(/[^\/]+\/\.{2}\//, '');
    }
    return path;
  }

  function wrap(contents) {
    var prefix = '!(function (module, exports) {';
    var suffix = '}).call(global, module, exports);';
    return [prefix, contents, suffix].join('\n');
  }

  function haswrap(path) {
    var sep = '/', parts = path.split(sep);
    return [RegExp(_w + '(\.jsx?)?$').test(parts.pop()), parts];
  }

  function mixin(target, source, _) {
    for (_ in source) target[_] = source[_];
  }

  function require() {
    return global['eval'].call(global, """(function require(moduleId) {
      var cur = './', sep = '/';

      if (moduleId.indexOf(cur) === 0) {
        moduleId = moduleId.slice(2);
      }

      var filepath = $.fileName;
      var ret = haswrap(filepath), parts;

      if (ret.shift()) {
        parts = ret.shift().concat(moduleId);
      } else {
        parts = filepath.split(sep);
        parts.splice(parts.length - 1, 1, moduleId);
      }

      moduleId = normpath(parts.join(sep));
      moduleId = File.decode(moduleId);

      return MODULE_CACHES[moduleId] || (function () {
        try {
          var nakedFile = new File(moduleId);
          var exts = ['.jsx', '.js'];

          while (!nakedFile.exists) {
            var extension = exts.shift();

            if (!extension) {
              throw Error(File.decode(moduleId) + ' is NOT a MODULE!');
              return;
            }

            nakedFile = new File(moduleId + extension);
          }

          moduleId = nakedFile.fullName;

          var module = { exports: function () {} };
          var basename = nakedFile.displayName.split('.')[0];
          var regExt = /\.jsx?$/;

          if (SHIM[basename]) {
            $.evalFile(moduleId);
            module.exports = this[SHIM[basename]];
          } else {
            nakedFile.open('r');

            var contents = wrap(nakedFile.read());
            nakedFile.close();

            var wrappedModuleId = moduleId.replace(regExt, _w + '$&');
            var wrappedFile = new File(wrappedModuleId);

            wrappedFile.open('w');
            wrappedFile.write(contents);
            wrappedFile.close();

            try {
              with (module) { $.evalFile(wrappedFile); }
            } finally {
              wrappedFile.remove();
            }
          }

          // The module id being cached SHOULD have no extension
          moduleId = moduleId.replace(regExt, '');

          return (MODULE_CACHES[moduleId] = (module || {}).exports);
        } catch (e) {
          alert(e.message);
        }
      })();
    })""");
  }

  mixin(SHIM, (global.require = require())('./shim'));
}).call($.global);
