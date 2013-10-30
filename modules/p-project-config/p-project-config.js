fly.loadModule('p-project-config', {
    __init: function() {
        this._initControls();

        this.dom.on('change', '.p-project-config__input', $.proxy(this._onInputChange, this));
        this.getElem('submit').on('click', $.proxy(this._onSubmitClick, this));
    },

    _initControls: function() {
        this.controls = {
            input: this.dom.find('.b-input').flyficate('b-input'),
            submit: this.getElem('submit').flyficate('b-button')
        };
    },

    _onInputChange: function(e, value) {
        var target = $(e.target);
        if (target.hasClass('p-project-config__input')) {
            var name = target.fly().getMod('name');
            if (['compile-less', 'compile-sass', 'compile-stylus', 'minify-css', 'minify-js'].indexOf(name) !== -1) {
                this.dom.find('.b-input_name_show' + name.substr(name.indexOf('-'))).fly().val(value);
                if (name === 'compile-stylus') this.dom.find('.b-input_name_compile-nib').fly()[value ? 'enable' : 'disable']();
            }
        }
    },

    _onSubmitClick: function() {
        this.close();
    },

    _set: function(params) {
        params = params || this.__self.params;
        for (var s in params) {
            for (var f in params[s]) {
                var value = params[s][f];
                this.dom.find('.b-input_name_' + s + '-' + f).fly().val(value);
            }
        }
        this.dom.find('.b-input_name_compile-nib').fly()[params.compile.stylus ? 'enable' : 'disable']();
        return this;
    },

    open: function(params) {
        this
            ._set(params)
            .setMod('visible', 'yes');
    },

    close: function() {
        this.delMod('visible');
    }
}, {
    params: {
        general: {
            name: '',
            path: '/home'
        },
        scan: {
            time: true,
            hotkey: true
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
            sass: true,
            stylus: true,
            css: true,
            js: true
        },
        compile: {
            less: true,
            sass: true,
            stylus: true,
            nib: true
        },
        minify: {
            css: true,
            js: true
        }
    }
});