var deps = {
        scripts: ['jquery', 'transit', 'inherit', 'easy', 'fly'],
        styles: [],
        modules: ['w-ajax', 'c-project-menu', 'c-file-panel', 'c-config-panel', 'c-project-panel'],
        elements: ['c-project-menu/item']
    },
    strings = {
        scripts: '<script src="scripts/%ID%/%ID%.js"></script>',
        styles: '<link rel="stylesheet" href="styles/%ID%/%ID%.css"/>',
        modules: '<script src="modules/%ID%/%ID%.js"></script><link rel="stylesheet" href="modules/%ID%/%ID%.css"/>',
        elements: '<script src="modules/%ID%/%NAME%.js"></script><link rel="stylesheet" href="modules/%ID%/%NAME%.css"/>'
    },
    lib = {
        fs: require('fs'),
        async: require('async'),
        stylus: require('stylus'),
        nib: require('nib')
    },
    templates = {},
    buffer = '';

for (var s in strings) {
    for (var d = 0, l = deps[s].length; d < l; d++) {
        var item = deps[s][d],
            id = item,
            name = s === 'elements' ? item.substr(item.indexOf('/') + 1) : item;

        if (s === 'elements' || s === 'modules') {
            var data = lib.fs.readFileSync('modules/' + id + '/' + name + '.fly.html', {encoding: 'utf-8'}).split('<content/>'),
                t = id.replace('/', '__');
            templates[t + '.start'] = data[0] || '';
            templates[t + '.end'] = data[1] || '';
        }

        buffer += strings[s].replace(/%ID%/g, id).replace(/%NAME%/g, name);
    }
}

document.write(buffer);
