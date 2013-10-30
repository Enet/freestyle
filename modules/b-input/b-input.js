fly.loadModule('b-input', {
    __init: function() {
        this.getElem('input').on('change', $.proxy(this._onInputChange, this));
    },

    _onInputChange: function(e) {
        this.dom.trigger('change', [this._get()]);
    },

    val: function(value) {
        return this[typeof value === 'undefined' ? '_get' : '_set'](value);
    },

    _set: function(value) {
        this.getElem('input').val(value);
        return this;
    },

    _get: function() {
        return this.getElem('input').val();
    },

    enable: function() {
        this.getElem('input').removeAttr('disabled');
        return this;
    },

    disable: function() {
        this.getElem('input').attr('disabled', 'disabled');
        return this;
    }
});

fly.loadModule('b-input_type_checkbox', {
    _set: function(value) {
        this.getElem('input').get(0).checked = !!value;
        return this;
    },

    _get: function() {
        return this.getElem('input').get(0).checked;
    }
});

fly.loadModule('b-input_type_file', {
    __init: function() {
        this.__base.apply(this, arguments);
        this.getElem('file').on('click', $.proxy(this._onFileClick, this));
    },

    _onInputChange: function(e, value) {
        this._set(value);
        this.__base.apply(this, arguments);
    },

    _onFileClick: function() {
        this.getElem('input').trigger('click');
    },

    _set: function(value) {
        this.getElem('input').attr('nwworkingdir', value);
        this.getElem('file').attr('title', value);
        return this;
    },

    _get: function() {
        return this.getElem('input').attr('nwworkingdir');
    }
});