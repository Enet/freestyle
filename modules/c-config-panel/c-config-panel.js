fly.loadModule('c-config-panel', {
    __init: function() {
        this._initControls();

        this.dom.on('click', '.b-button', $.proxy(this._onButtonClick, this));
    },

    _initControls: function() {
        this.controls = {
            button: this.getElem('button').flyficate('b-button')
        };
    },

    _onButtonClick: function(e) {
        var target = $(e.target),
            id = this.getMod(target, 'id');

        this[id]();
    },

    file: function() {
        var path = storage.current.file.path;
        path !== null && lib.gui.Shell.openItem(path);
    },

    folder: function() {
        var path = storage.current.file.path;
        path !== null && lib.gui.Shell.showItemInFolder(path);
    },

    compile: function() {
        this.dom.trigger('compile', [storage.current.file.path]);
    },

    minify: function() {
        this.dom.trigger('minify', [storage.current.file.path]);
    },

    update: function() {
        var path = storage.current.file.path,
            ext = path === null ? '' : path.substr(path.lastIndexOf('.') + 1);
        return this.setMod('ext', ext);
    }
});