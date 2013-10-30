fly.loadModule('p-project-remove', {
    __init: function() {
        this._initControls();

        this.getElem('submit').on('click', $.proxy(this._onSubmitClick, this));
        this.getElem('cancel').on('click', $.proxy(this._onCancelClick, this));
    },

    _initControls: function() {
        this.controls = {
            submit: this.getElem('submit').flyficate('b-button'),
            cancel: this.getElem('cancel').flyficate('b-button')
        };
    },

    _onCancelClick: function() {
        this.close();
    },

    _onSubmitClick: function() {
        this
            .save()
            .close();
    },

    save: function() {
        delete storage.projects[this._title];
        app.save();
        return this;
    },

    open: function(params) {
        this.getElem('title').html(this._title = params.title);
        return this.setMod('visible', 'yes');
    },

    close: function() {
        return this.delMod('visible');
    }
});