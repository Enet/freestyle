fly.loadModule('c-file-panel', {
    __init: function() {

    },

    update: function() {
        this.findElem('item').remove();

        var current = storage.current.project,
            project = storage.projects[current],
            html = '';

        if (typeof project === 'object' && storage.files[current] instanceof Array) {
            for (var f = 0, l = storage.files[current].length; f < l; f++) {
                var file = storage.files[current][f],
                    ext = file.filename.substr(file.filename.lastIndexOf('.'));
                if ((project.show.stylus && ext === '.styl') ||
                    (project.show.less && ext === '.less') ||
                    (project.show.sass && ext === '.scss') ||
                    (project.show.css && ext === '.css' && file.filename.substr(-8) !== '.min.css') ||
                    (project.show.js && ext === '.js' && file.filename.substr(-7) !== '.min.js')) {
                    html += fly.render('<c-file-panel__file filename="@' + file.filename + '" path="@' + file.rel + '"/>');
                }
            }
            this.dom.html(html);
        }

        return this;
    }
});