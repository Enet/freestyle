var deps = {
        scripts: ['jquery', 'transit', 'inherit', 'easy', 'fly'],
        styles: ['reset'],
        modules: [
            'w-ajax', 'p-project-config', 'p-project-remove',
            'c-project-menu', 'c-file-panel', 'c-config-panel', 'c-project-panel', 'c-overlay',
            'b-input', 'b-button',
            'i-notify-manager'
        ],
        elements: [
            'p-project-config/list', 'p-project-config/header',
            'c-project-menu/item', 'c-project-panel/project', 'c-file-panel/file', 'c-file-panel/scroll'
        ]
    },
    strings = {
        scripts: '<script src="scripts/%ID%/%ID%.js"></script>',
        styles: '<link rel="stylesheet" href="styles/%ID%/%ID%.css"/>',
        modules: '<script src="modules/%ID%/%ID%.js"></script><link rel="stylesheet" href="modules/%ID%/%ID%.css"/>',
        elements: '<script src="modules/%ID%/%NAME%.js"></script><link rel="stylesheet" href="modules/%ID%/%NAME%.css"/>'
    },
    lib = {
        fs: require('fs'),
        exec: require('child_process').exec,
        gui: require('nw.gui'),
        async: require('async'),
        stylus: require('stylus'),
        nib: require('nib'),
        less: require('less'),
        sqwish: require('sqwish'),
        uglifyjs: require('uglify-js'),
        walk: require('walk')['walk']
    },
    templates = {},
    storage = {
        current: {
            project: null,
            file: {
                id: null,
                path: null
            }
        }
    },
    buffer = '';

for (var s in strings) {
    for (var d = 0, l = deps[s].length; d < l; d++) {
        var item = deps[s][d],
            id = item,
            name = s === 'elements' ? item.substr(item.indexOf('/') + 1) : item;

        if (s === 'elements' || s === 'modules' && id[0] !== 'i') {
            var data = lib.fs.readFileSync('modules/' + id + '/' + name + '.fly.html', {encoding: 'utf-8'}).split('<content/>'),
                t = id.replace('/', '__');
            templates[t + '.start'] = data[0] || '';
            templates[t + '.end'] = data[1] || '';
        }

        buffer += strings[s].replace(/%ID%/g, id).replace(/%NAME%/g, name);
    }
}

delete data;
document.write(buffer);

if (typeof localStorage.projects === 'undefined') localStorage.projects = JSON.stringify({});