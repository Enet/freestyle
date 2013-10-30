fly.loadModule('c-project-menu', {
    __init: function() {
        this.dom.on('click', '.c-project-menu__item', $.proxy(this._onItemClick, this));
    },

    _onItemClick: function(e) {
        var id = this.getMod($(e.target), 'id');
        this[id]();
    },

    add: function() {
        app.open('project');
    },

    remove: function() {

    },

    refresh: function() {

    },

    configure: function() {

    }
});