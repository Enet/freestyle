fly.loadModule('p-project-config', {
    __init: function() {
        this._initControls();

        this.dom.on('change', '.p-project-config__input', $.proxy(this._onInputChange, this));
        this.getElem('submit').on('click', $.proxy(this._onSubmitClick, this));
        this.getElem('cancel').on('click', $.proxy(this._onCancelClick, this));
    },

    _initControls: function() {
        this.controls = {
            input: this.dom.find('.b-input').flyficate('b-input'),
            submit: this.getElem('submit').flyficate('b-button'),
            cancel: this.getElem('cancel').flyficate('b-button')
        };
    },

    _onInputChange: function(e, value) {
        var target = $(e.target);
        if (target.hasClass('p-project-config__input')) {
            var name = target.fly().getMod('name');
            if (['compile-less', 'compile-stylus', 'minify-css', 'minify-js'].indexOf(name) !== -1) {
                this.dom.find('.b-input_name_show' + name.substr(name.indexOf('-'))).fly().val(value);
                if (name === 'compile-stylus') this.dom.find('.b-input_name_compile-nib').fly()[value ? 'enable' : 'disable']();
            }
        }
    },

    _onCancelClick: function() {
        this.close();
    },

    _onSubmitClick: function() {
        this.save();
    },

    _get: function() {
        var params = {};
        for (var s in this.__self.params) {
            params[s] = {};
            for (var f in this.__self.params[s]) {
                params[s][f] = this.dom.find('.b-input_name_' + s + '-' + f).fly().val();
            }
        }
        return params;
    },

    _set: function(params) {
        params = params || this.__self.params;
        this._title = params.general.title;
        this._path = params.general.path;
        for (var s in params) {
            for (var f in params[s]) {
                var value = params[s][f];
                this.dom.find('.b-input_name_' + s + '-' + f).fly().val(value);
            }
        }
        this.dom.find('.b-input_name_compile-nib').fly()[params.compile.stylus ? 'enable' : 'disable']();
        return this;
    },

    save: function() {
        var project = this._get();
        if (/[a-zA-Zа-яА-Я0-9]+/.test(project.general.title)) {
            if (this._title !== '') {
                if (this._path !== project.general.path) {
                    delete storage.updates[this._title];
                    delete storage.files[this._files];
                }
                if (this._title !== project.general.title) {
                    if (storage.files[this._title] instanceof Array) storage.files[project.general.title] = storage.files[this._title].slice(0);
                    if (typeof storage.updates[this._title] !== 'undefined') storage.updates[project.general.title] = storage.updates[this._title];
                    delete storage.updates[this._title];
                    delete storage.files[this._title];
                }
                delete storage.projects[this._title];
            }
            storage.projects[project.general.title] = project;
            app.save();
            this.dom.trigger('update', [this._title, project.general.title]);
            return this.close();
        } else {
            alert('Please, enter the project name consists of latin or cyrillic symbols or digits.');
            return this;
        }
    },

    open: function(params) {
        return this
            ._set(params)
            .setMod('visible', 'yes');
    },

    close: function() {
        return this.delMod('visible');
    }
}, {
    params: {
        general: {
            title: '',
            path: '/home'
        },
        scan: {
            time: true,
            tray: true
        },
        notify: {
            error: true,
            success: true
        },
        exception: {
            noscan: 'node_modules'
        },
        show: {
            less: true,
            stylus: true,
            css: true,
            js: true
        },
        compile: {
            less: true,
            stylus: true,
            nib: true
        },
        minify: {
            css: true,
            js: true
        }
    }
});