fly.loadModule('c-project-menu', {
    __init: function() {
        this.dom.on('click', '.c-project-menu__item', $.proxy(this._onItemClick, this));
    },

    _onItemClick: function(e) {
        var id = this.getMod($(e.target), 'id');
        if (this.hasMod('activated', 'yes') || id === 'add') this[id]();
    },

    add: function() {
        app.open('project');
    },

    remove: function() {
        app.open('remove', {title: storage.current.project});
    },

    refresh: function() {

    },

    configure: function() {
        app.open('project', storage.projects[storage.current.project]);
    }
});