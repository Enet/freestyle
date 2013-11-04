var body = $('#body'),
    header = $('#h1'),
    content = $('#p'),
    gui = null;

body.on('click contextmenu', function() {
    gui.hide();
});

window.update = function(message) {
    if (gui === null) gui = message._window;
    body.attr('data-status', message.status);
    header.html(message.title);
    content.html(message.content);
};
