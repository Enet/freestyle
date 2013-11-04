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

    _onTimerTick: function() {
        app.scan(storage.current.project);
    },

    select: function(title) {
        this
            .unselect()
            .setMod(this.findElem('project_title_' + title), 'selected', 'yes')
            .controls.menu.setMod('activated', 'yes');

        app.scan(storage.current.project = title);
        if (storage.projects[title].scan.time) this._timer = setInterval($.proxy(this._onTimerTick, this), 150000);
        this.dom.trigger('select', [title]);
        return this;
    },

    unselect: function() {
        clearInterval(this._timer);
        this
            .delMod(this.findElem('project_title_' + storage.current.project), 'selected')
            .controls.menu.setMod('activated', 'no');
        
        this.dom.trigger('select', [storage.current.project = null]);
        return this;
    },

    _onProjectClick: function(e) {
        var target = $(e.target),
            title = this.getMod(target, 'title');

        if (title !== storage.current.project) {
            this.select(title);
        } else {
            this.unselect();
        }
    },

    update: function(title) {
        var html = '';
        this.findElem('project').remove();
        for (var p in storage.projects) {
            var project = storage.projects[p];
            html += fly.render('<c-project-panel__project path="@' + project.general.path + '" title="' + project.general.title + '"/>');
        }
        this.dom.prepend(html);
        if (typeof title !== 'undefined') this[title === '' ? 'unselect' : 'select'](title);
    }
});