fly.loadModule('c-file-panel', {
    __init: function() {
        this.getElem('scroll').on('click', $.proxy(this._onScrollClick, this));
        this.getElem('button').on('mousedown', $.proxy(this._onButtonMouseDown, this));
        this.getElem('container').on('mousewheel', $.proxy(this._onContainerMouseWheel, this));
        this.dom
            .on('mouseenter', '.c-file-panel__file', $.proxy(this._onFileMouseEnter, this))
            .on('mouseleave', '.c-file-panel__file', $.proxy(this._onFileMouseLeave, this))
            .on('click', '.c-file-panel__file', $.proxy(this._onFileClick, this));
    },

    select: function(file) {
        this
            .unselect()
            .setMod(this.findElem('file_id_' + file.id), 'selected', 'yes');

        this.dom.trigger('select', [storage.current.file = file]);
        return this;
    },

    unselect: function() {
        this
            .delMod(this.findElem('file_id_' + storage.current.file.id), 'selected')
            .dom.trigger('select', [storage.current.file = {id: null, path: null}]);
        return this;
    },

    _onFileClick: function(e) {
        var target = $(e.target).closest('.c-file-panel__file'),
            id = this.getMod(target,'id');
        if (id === storage.current.file.id) {
            this.unselect();
        } else {
            var path = target.attr('data-path');
            this.select({id: id, path: path});
        }
    },

    _onFileMouseEnter: function(e) {
        var target = $(e.target).closest('.c-file-panel__file'),
            container = target.find('.c-file-panel__pathcontainer'),
            containerWidth = container.width() + parseInt(container.css('padding-left')) + parseInt(container.css('padding-right')),
            panelWidth = target.width();

        if (containerWidth > panelWidth) {
            var duration = (containerWidth - panelWidth) * 40,
                normal = function() {
                    container.animate({left: panelWidth - containerWidth}, duration, 'linear', reverse);
                },
                reverse = function() {
                    container.animate({left: 0}, duration, 'linear', normal);
                };
            normal();
        }

    },

    _onFileMouseLeave: function(e) {
        var target = $(e.target).closest('.c-file-panel__file'),
            container = target.find('.c-file-panel__pathcontainer');
        container.stop().css('left', 0);
    },

    _getPosition: function() {
        return this.getElem('button').offset().top;
    },

    _setPosition: function(position) {
        var scrollHeight = this.getElem('scroll').height(),
            buttonHeight = this._getHeight(),
            containerHeight = this.getElem('container').height();
        position = Math.max(0, Math.min(position, scrollHeight - buttonHeight));
        this.getElem('button').css('top', position);
        position = (containerHeight - scrollHeight) * position / (scrollHeight - buttonHeight);
        this.getElem('container').css('top', -position);
        return this;
    },

    _getHeight: function() {
        return this.getElem('button').height();
    },

    _onContainerMouseWheel: function(e) {
        this._setPosition(this._getPosition() - this._getHeight() * e.originalEvent.wheelDeltaY / 500);
    },

    _onButtonMouseDown: function(e) {
        this.setMod('scrollable', 'yes');
        this._start = e.clientY;
        app.dom
            .on('mousemove', $.proxy(this._onDocumentMouseMove, this))
            .on('mouseup', $.proxy(this._onDocumentMouseUp, this));
    },

    _onDocumentMouseUp: function() {
        this.delMod('scrollable');
        app.dom
            .off('mousemove')
            .off('mouseup');      
    },

    _onDocumentMouseMove: function(e) {
        this._setPosition(this._getPosition() + e.clientY - this._start);
        this._start = e.clientY;
    },

    _onScrollClick: function(e) {
        var position = this._getPosition(),
            height = this._getHeight();
        if (e.clientY < position) {
            this._setPosition(position - height / 2);
        } else if (e.clientY > position + height) {
            this._setPosition(position + height / 2);
        }
    },

    update: function() {
        this
            .unselect()
            .findElem('file').remove();

        this.getElem('container').css('top', 0);

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
                    html += fly.render('<c-file-panel__file id="' + f + '" filename="@' + file.filename + '" rel="' + file.rel + '" path="@' + file.path + '"/>');
                }
            }
            this.getElem('container').html(html);
        }

        var scrollHeight = this.getElem('scroll').height(),
            containerHeight = this.getElem('container').height();
        if (containerHeight <= scrollHeight) {
            this.setMod(this.getElem('scroll'), 'hidden', 'yes');
            this.getElem('button').css({
                top: 0,
                height: scrollHeight
            });
        } else {
            this.delMod(this.getElem('scroll'), 'hidden');
            this.getElem('button').css({
                top: 0,
                height: scrollHeight * scrollHeight / containerHeight
            });
        }

        return this;
    }
});