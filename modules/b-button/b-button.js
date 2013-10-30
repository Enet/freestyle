fly.loadModule('b-button', {
    __init: function() {
        this.dom
            .on('mousedown', $.proxy(this._onMouseDown, this))
            .on('mouseup mouseleave', $.proxy(this._onMouseUp, this));
    },

    _onMouseDown: function() {
        this.dom.transition({scale: 0.9}, 300);
    },

    _onMouseUp: function() {
        this.dom.transition({scale: 1}, 300);
    }
});