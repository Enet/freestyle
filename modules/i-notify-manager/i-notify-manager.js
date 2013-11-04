fly.loadModule('i-notify-manager', {
    __init: function() {
        this._window = lib.gui.Window.open('frameless.html', {
            'position': 'center',
            'title': 'Freestyle Popup',
            'left': 0,
            'width': 250,
            'height': 100,
            'frame': false,
            'toolbar': false,
            'always-on-top': true,
            'x': screen.availWidth - 250,
            'y': screen.availHeight - 100,
            'show': false
        });
    },

    message: function(message) {
        message = $.extend({status: '', title: '', content: '', timer: 5, _window: this._window}, message);
        
        this._window.show();
        this._window.window.update(message);
        
        clearTimeout(this._timer);
        this._timer = setTimeout($.proxy(function() {
            this._window.hide();
        }, this), message.timer * 1000);

        return this;
    }
});