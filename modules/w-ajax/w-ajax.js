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
        this
            .load()
            ._initControls();
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
        return this;
    }
});