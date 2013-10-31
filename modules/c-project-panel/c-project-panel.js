fly.loadModule('c-project-panel', {
    __init: function() {
        this._initControls();
        this.update();

        this.dom.on('click', '.c-project-panel__project', $.proxy(this._onProjectClick, this));
    },

    _initControls: function() {
        this.controls = {
            menu: $('.c-project-menu').flyficate('c-project-menu')[0]
        };
    },

    _onProjectClick: function(e) {
        var target = $(e.target),
            selection = this.findElem('project_selected_yes');

        this.delMod(selection, 'selected');
        app.unwatch();
        if (target.get(0) !== selection.get(0)) {
            app.scan(storage.current.project = this.getMod(target, 'title'));
            this.setMod(target, 'selected', 'yes');
            this.controls.menu.setMod('activated', 'yes');
        } else {
            this.controls.menu.setMod('activated', 'no');
        }
    },

    update: function() {
        var html = '';
        this.findElem('project').remove();
        for (var p in storage.projects) {
            var project = storage.projects[p];
            html += fly.render('<c-project-panel__project path="@' + project.general.path + '" title="' + project.general.title + '"/>');
        }
        this.dom.prepend(html);
    }
});