fly.loadModule('c-project-panel', {
    __init: function() {
        this._initControls();
    },

    _initControls: function() {
        this.controls = {
            menu: $('.c-project-menu').flyficate('c-project-menu')[0]
        };
    }
});