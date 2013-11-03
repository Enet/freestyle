fly.loadModule('w-ajax', {
    __init: function() {
        this.dom.on('ready', $.proxy(this._onReady, this));
    },

    _initControls: function() {
        this.controls = {
            overlay: $('.c-overlay').flyficate('c-overlay')[0],
            panel: {
                project: $('.c-project-panel').flyficate('c-project-panel')[0],
                config: $('.c-config-panel').flyficate('c-config-panel')[0],
                file: $('.c-file-panel').flyficate('c-file-panel')[0]
            },
            page: {
                project: $('.p-project-config').flyficate('p-project-config')[0],
                remove: $('.p-project-remove').flyficate('p-project-remove')[0]
            }
        };
    },

    _onReady: function() {
        this.getElem('body').html(fly.render('<w-ajax/>'));
        this._watchers = [];
        this._scanning = [];
        this
            .load()
            ._initControls();

        this.controls.page.project.dom.on('update', $.proxy(this._onPageProjectUpdate, this));
        this.controls.page.remove.dom.on('update', $.proxy(this._onPageRemoveUpdate, this));
        this.controls.panel.project.dom.on('select', $.proxy(this._onProjectPanelSelect, this));
        this.controls.panel.file.dom.on('select', $.proxy(this._onFilePanelSelect, this));
        this.controls.panel.config.dom
            .on('compile', $.proxy(this._onConfigPanelCompile, this))
            .on('minify', $.proxy(this._onConfigPanelMinify, this));

        lib.gui.Window.get().show();
    },

    _onPageProjectUpdate: function(e, prev, curr) {
        this.controls.panel.project.update(curr);
    },

    _onPageRemoveUpdate: function(e, prev, curr) {
        this.controls.panel.project.update(curr);
    },

    _onConfigPanelCompile: function(e, path) {
        var ext = path === null ? '' : path.substr(path.lastIndexOf('.') + 1);
        if (ext === 'styl') {
            this._compileStylus(path, true);
        } else if (ext === 'less') {
            this._compileLESS(path, true);
        }
    },

    _onConfigPanelMinify: function(e, path) {
        var ext = path === null ? '' : path.substr(path.lastIndexOf('.') + 1);
        if (ext === 'js') {
            this._minifyJS(path, true);
        } else if (ext === 'css') {
            this._minifyCSS(path, true);
        }
    },

    _onFilePanelSelect: function(e, file) {
        this.controls.panel.config.update();
    },

    _onProjectPanelSelect: function(e, title) {
        this.controls.panel.file.update();
    },

    scan: function(title, force) {
        var project = storage.projects[title];

        if (force !== true && storage.files[title] instanceof Array && (storage.updates[title] - (new Date()).getTime() < 300000 || project.scan.time === false)) {
            this._onScanComplete();
        } else if (this._scanning.indexOf(title) === -1) {
            this._scanning.push(title);

            var that = this,
                walker = lib.walk(project.general.path, {followLinks: false}),
                exception = project.exception.noscan.split(',');

            storage.files[title] = [];
            
            walker
                .on('file', function(root, stats, next) {
                    var filename = stats.name,
                        ext = filename.substr(filename.lastIndexOf('.'));

                    if (['.less', '.styl', '.css', '.js'].indexOf(ext) !== -1) {
                        var path = root + '/' + filename,
                            rel = path.substr(project.general.path.length + 1),
                            valid = true;

                        for (var e = 0, l = exception.length; e < l; e++) {
                            if (rel.indexOf(exception[e]) !== -1) {
                                valid = false;
                                break;
                            }
                        }

                        valid && storage.files[title].push({
                            path: path,
                            rel: rel,
                            filename: filename,
                            mtime: stats.mtime
                        });
                    }
                    next();
                })
                .on('end', function() {
                    that._scanning.pop(title);
                    storage.updates[title] = (new Date()).getTime();
                    if (title === storage.current.project) that._onScanComplete();
                });
        }
        return this;
    },

    _onScanComplete: function() {
        app.watch();
        this.controls.panel.file.update();
    },

    watch: function() {
        var that = this,
            files = storage.files[storage.current.project];
        console.log('watch files');
        for (var f = 0, l = files.length; f < l; f++) {
            this._setWatcher(files[f].path);
        }
        return this;
    },

    _setWatcher: function(path) {
        var that = this;
        this._watchers.push(path);
        lib.fs.watchFile(path, {persistent: false}, function(currStat, prevStat) {
            that._onFileChange.call(that, path, currStat, prevStat);
        });
        return this;
    },

    _unsetWatcher: function(path) {
        console.log('unsetWatcher', path);
        this._watchers.pop(path);
        lib.fs.unwatchFile(path);
        return this;
    },

    unwatch: function() {
        console.log('UNwatch files');
        for (var f = 0, l = this._watchers.length; f < l; f++) {
            lib.fs.unwatchFile(this._watchers[f]);
        }
        this._watchers = [];
        return this;
    },

    exec: function(command, callback, context) {
        context = context || this;
        lib.exec(command, function(error, stdout, stderr) {
            callback.call(context, stdout);
        });
    },

    _onFileChange: function(path, currStat, prevStat) {
        if (currStat.ino === 0) {
            this._unsetWatcher(path);

            var sep = path.lastIndexOf('/'),
                dirname = path.substring(0, sep),
                filename = path.substr(sep + 1);

            this.exec('ls -i ' + dirname + ' | grep ' + prevStat.ino, function(stdout) {
                if (stdout.length > 0) this._setWatcher(dirname + '/' + stdout.substr(0, stdout.length - 1).substr(('' + prevStat.ino).length + 1));
            });
        } else if (currStat.mtime > prevStat.mtime) {
            var ext = path.substr(path.lastIndexOf('.'));
            switch (ext) {
                case '.styl':
                    this._compileStylus(path);
                    break;
                case '.less':
                    this._compileLESS(path);
                    break;
                case '.css':
                    this._minifyCSS(path);
                    break;
                case '.js':
                    this._minifyJS(path);
                    break;
            }
        }
    },

    _compileStylus: function(path, force) {
        var project = storage.projects[storage.current.project];
        if (project.compile.stylus || force) {
            var that = this,
                target = path.substr(0, path.length - 4) + 'css';
            
            lib.fs.readFile(path, {encoding: 'utf-8'}, function(error, data) {
                if (error === null) {
                    if (project.compile.nib) data = '@import \'nib\';\n' + data;
                    var stylus = lib.stylus(data).set('filename', path);
                    if (project.compile.nib) stylus.use(lib.nib());
                    stylus.render(function(error, css) {
                        if (error === null) {
                            lib.fs.writeFile(target, css, function(error) {
                                if (error === null) {
                                    if (that._watchers.indexOf(target) === -1) {
                                        that
                                            ._setWatcher(target)
                                            ._minifyCSS(target);
                                    }
                                } else {

                                }
                            });
                        } else {

                        }
                    });
                } else {

                }
            });
        }
    },

    _compileLESS: function(path, force) {
        var project = storage.projects[storage.current.project];
        if (project.compile.less || force) {
            var that = this,
                target = path.substr(0, path.length - 4) + 'css';
            
            lib.fs.readFile(path, {encoding: 'utf-8'}, function(error, data) {
                if (error === null) {
                    lib.less.render(data, function(error, css) {
                        if (error === null) {
                            lib.fs.writeFile(target, css, function(error) {
                                if (error === null) {
                                    if (that._watchers.indexOf(target) === -1) {
                                        that
                                            ._setWatcher(target)
                                            ._minifyCSS(target);
                                    }
                                } else {

                                }
                            });
                        } else {

                        }
                    });
                } else {

                }
            });
        }
    },

    _minifyCSS: function(path, force) {
        var project = storage.projects[storage.current.project];

        if (project.minify.css || force) {
            var target = path.substr(0, path.length - 3) + 'min.css';
            
            lib.fs.readFile(path, {encoding: 'utf-8'}, function(error, data) {
                if (error === null) {
                    try {
                        var result = lib.sqwish.minify(data);
                        lib.fs.writeFile(target, result, function(error) {
                            if (error === null) {

                            } else {

                            }
                        });
                    } catch(error) {

                    }
                } else {

                }
            });
        }
    },

    _minifyJS: function(path, force) {
        var project = storage.projects[storage.current.project];

        if (project.minify.js || force) {
            try {
                var target = path.substr(0, path.length - 2) + 'min.js',
                    result = lib.uglifyjs.minify(path);

                lib.fs.writeFile(target, result.code, function(error) {
                    if (error === null) {

                    } else {

                    }
                });
            } catch(error) {

            }
        }
    },

    open: function(page, params) {
        this.controls.page[page].open(params);
    },

    save: function() {
        localStorage.projects = JSON.stringify(storage.projects);
        return this;
    },

    load: function() {
        storage.projects = JSON.parse(localStorage.projects);
        storage.files = {};
        storage.updates = {};
        return this;
    }
});