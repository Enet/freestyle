fly.loadModule('w-ajax', {
    __init: function() {
        this.dom.on('ready', $.proxy(this._onReady, this));
    },

    _onReady: function() {
        this.getElem('body').html(fly.render('<w-ajax/>'));
    }
});