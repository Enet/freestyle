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
            },
            notify: fly.initInstance(null, 'i-notify-manager')
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

        this._setGUI();
    },

    _setGUI: function() {
        var win = lib.gui.Window.get(),
            tray = new lib.gui.Tray({title: 'Freestyle', icon: 'images/tray_icon.png'});

        tray.on('click', $.proxy(function() {
            var title = storage.current.project,
                project = title === null ? null : storage.projects[title];
            
            if (project !== null && project.scan.tray) app.scan(title, true);
        }, this));

        win.on('close', function() {
            tray.remove();
            lib.gui.App.quit();
        });

        win.show();
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

    notify: function(status, title, content) {
        var project = storage.projects[storage.current.project] || {};
        if ((status === 'success' && project.notify.success) || (status === 'error' && project.notify.error)) {
            this.controls.notify.message({
                status: status,
                title: title,
                content: content
            });
        }
        return this;
    },

    scan: function(title, force) {
        var project = storage.projects[title];

        if (force !== true && storage.files[title] instanceof Array && ((new Date()).getTime() - storage.updates[title] < 300000 || project.scan.time === false)) {
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

                    if (filename.substr(-7) !== '.min.js' && filename.substr(-8) !== '.min.css' && ['.less', '.styl', '.css', '.js'].indexOf(ext) !== -1) {
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
                    that._scanning.splice(that._scanning.indexOf(title), 1);
                    storage.updates[title] = (new Date()).getTime();
                    if (title === storage.current.project) that._onScanComplete();
                    that.notify('success', 'Scan is completed', 'Files for project ' + title + ' were updated.');
                });
        }
        return this;
    },

    _onScanComplete: function() {
        app.unwatch().watch();
        this.controls.panel.file.update();
    },

    watch: function() {
        var that = this,
            files = storage.files[storage.current.project];
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
        this._watchers.splice(this._watchers.indexOf(path), 1);
        lib.fs.unwatchFile(path);
        return this;
    },

    unwatch: function() {
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
                if (stdout.length > 0) {
                    var newpath = dirname + '/' + stdout.substr(0, stdout.length - 1).substr(('' + prevStat.ino).length + 1),
                        files = storage.files[storage.current.project];
                    this._setWatcher(newpath);
                    this.notify('success', 'File is moved', 'File ' + filename + ' is moved.');
                    for (var f = 0, l = files.length; f < l; f++) {
                        if (files[f].path === path) {
                            files[f] = {
                                path: newpath,
                                rel: newpath.substr(storage.projects[storage.current.project].general.path.length + 1),
                                filename: newpath.substr(newpath.lastIndexOf('/') + 1),
                                mtime: currStat.mtime
                            };
                            this.controls.panel.file.update();
                            break;
                        }
                    }
                } else {
                    this.notify('success', 'File is deleted', 'File ' + filename + ' is deleted.');
                    var files = storage.files[storage.current.project];
                    for (var f = 0, l = files.length; f < l; f++) {
                        if (files[f].path === path) {
                            files.splice(f, 1);
                            this.controls.panel.file.update();
                            break;
                        }
                    }
                }
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
                filename = path.substr(path.lastIndexOf('/') + 1),
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
                                    that.notify('success', 'Stylus is compiled', 'Filepath: ' + filename + '.');
                                    if (that._watchers.indexOf(target) === -1) {
                                        that
                                            ._setWatcher(target)
                                            ._minifyCSS(target)
                                            ._addCSS(target);
                                    }
                                } else {
                                    that.notify('error', 'Writefile error', 'Filepath: ' + filename + '.');
                                }
                            });
                        } else {
                            that.notify('error', 'Stylus error', 'Filepath: ' + filename + '.');
                        }
                    });
                } else {
                    that.notify('error', 'Readfile error', 'Filepath: ' + filename + '.');
                }
            });
        }

        return this;
    },

    _compileLESS: function(path, force) {
        var project = storage.projects[storage.current.project];
        if (project.compile.less || force) {
            var that = this,
                filename = path.substr(path.lastIndexOf('/') + 1),
                target = path.substr(0, path.length - 4) + 'css';
            
            lib.fs.readFile(path, {encoding: 'utf-8'}, function(error, data) {
                if (error === null) {
                    lib.less.render(data, function(error, css) {
                        if (error === null) {
                            lib.fs.writeFile(target, css, function(error) {
                                if (error === null) {
                                    that.notify('success', 'LESS is compiled', 'Filepath: ' + filename + '.');
                                    if (that._watchers.indexOf(target) === -1) {
                                        that
                                            ._setWatcher(target)
                                            ._minifyCSS(target)
                                            ._addCSS(target);
                                    }
                                } else {
                                    that.notify('error', 'Writefile error', 'Filepath: ' + filename + '.');
                                }
                            });
                        } else {
                            that.notify('error', 'LESS error', 'Filepath: ' + filename + '.');
                        }
                    });
                } else {
                    that.notify('error', 'Readfile error', 'Filepath: ' + filename + '.');
                }
            });
        }

        return this;
    },

    _addCSS: function(path) {
        storage.files[storage.current.project].push({
            path: path,
            rel: path.substr(storage.projects[storage.current.project].general.path.length + 1),
            filename: path.substr(path.lastIndexOf('/') + 1),
            mtime: new Date()
        });
        this.controls.panel.file.update();
        return this;
    },

    _minifyCSS: function(path, force) {
        var project = storage.projects[storage.current.project];

        if (project.minify.css || force) {
            var that = this,
                filename = path.substr(path.lastIndexOf('/') + 1),
                target = path.substr(0, path.length - 3) + 'min.css';
            
            lib.fs.readFile(path, {encoding: 'utf-8'}, function(error, data) {
                if (error === null) {
                    try {
                        var result = lib.sqwish.minify(data);
                        lib.fs.writeFile(target, result, function(error) {
                            if (error === null) {
                                that.notify('success', 'CSS is minified', 'Filepath: ' + filename + '.');
                            } else {
                                that.notify('error', 'Writefile error', 'Filepath: ' + filename + '.');
                            }
                        });
                    } catch(error) {
                        that.notify('error', 'Sqwish error', 'Filepath: ' + filename + '.');
                    }
                } else {
                    that.notify('error', 'Readfile error', 'Filepath: ' + filename + '.');
                }
            });
        }

        return this;
    },

    _minifyJS: function(path, force) {
        var project = storage.projects[storage.current.project];

        if (project.minify.js || force) {
            var that = this,
                filename = path.substr(path.lastIndexOf('/') + 1);
            try {
                var target = path.substr(0, path.length - 2) + 'min.js',
                    result = lib.uglifyjs.minify(path);

                lib.fs.writeFile(target, result.code, function(error) {
                    if (error === null) {
                        that.notify('success', 'JS is minified', 'Filepath: ' + filename + '.');
                    } else {
                        that.notify('error', 'Writefile error', 'Filepath: ' + filename + '.');
                    }
                });
            } catch(error) {
                that.notify('error', 'UglifyJS error', 'Filepath: ' + filename + '.');
            }
        }

        return this;
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