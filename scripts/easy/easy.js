var Easy = $.inherit({
    getter: function(handler) {
        this._get = handler || function(name, postfix) {return ''};
        return this;
    },

    before: function(string) {
        return string.replace(/<\?(.*?)\?>/gm, function(temp) {
            return temp.replace(/</g, '{{&lt;}}').replace(/>/g, '{{&gt;}}').replace(/"/g, '{{&quot;}}').replace(/'/g, '{{&#39;}}');
        }).replace(/<script>([\s\S]*?)<\/script>/gm, function(temp) {
            return '<script>' + temp.substring(8, temp.length - 9).replace(/</g, '{{&lt;}}').replace(/>/g, '{{&gt;}}').replace(/"/g, '}{}{&quot;}{}{').replace(/'/g, '}{}{&#39;}{}{') + '</script>';
        });
    },

    compile: function(template) {
        this._result = '';
        this.step('<e>' + this.before(template) + '</e>');
        return this.after(this._result);
    },

    after: function(string) {
        return (string = string.replace(/{{&lt;}}/g, '<').replace(/{{&gt;}}/g, '>').replace(/'/g, '\\\'').replace(/{{&quot;}}/g, '"').replace(/{{&#39;}}/g, '\'')).substring(3, string.length - 4);
    },

    trim: function(string, side) {
        if (side === 1) {
            return string.replace(/\s+$/, '');
        } else if (side === -1) {
            return string.replace(/^\s+/, '');
        } else {
            return this.trim(this.trim(string, 1), -1);
        }
    },

    stringify: function(array) {
        var left = '{ ',
            right = ',{}';
        if (array === null) array = [];
        for (var a = 0; a < array.length; a++) {
            var eq = array[a].indexOf('='),
                value = eq === -1 ? array[a] : this.trim(array[a].substr(eq + 1)),
                quote = symbol = value[0],
                name = array[a].substr(1, eq - 1).toLowerCase();
            if (quote === '"') {
                quote = '';
            } else if (quote === '\'') {
                value = (symbol = '{{&#39;}}') + value.substring(1, value.length - 1) + symbol;
                quote = '';
            } else {
                quote = '{{&#39;}}';
                symbol = '';
            }
            value = value.replace(/{{&lt;}}\?=(.*?)\?{{&gt;}}/g, function(temp) {
                return symbol + '+(' + temp.substring(10, temp.length - 9) + ')+' + symbol;
            });
            if (name === 'onclick') {
                right = ',' + value.substring(symbol.length, value.length - symbol.length);
            } else {
                left += '{{&#39;}}' + name + '{{&#39;}}:' + quote + value + quote + ',';
            }
        }
        left = left.substr(0, left.length - 1) + '}';
        return left + right;
    },

    pair: function(template, current) {
        var inside = this.inside(template),
            name = this.name(inside);
        if (name === current) {
            this.depth++;
        } else if (name === '/' + current) {
            if (this.depth-- === 0) return template.indexOf('<');
        }
        var offset = inside.length + template.indexOf('<') + 2;
        return offset + this.pair(template.substr(offset), current);
    },

    inside: function(template) {
        return this.trim(template.substring(template.indexOf('<') + 1, template.indexOf('>')));
    },

    name: function(string) {
        var s = string.indexOf(' ');
        return string.substring(0, ~s === 0 ? string.length : s);
    },

    step: function(template) {
        var inside = this.inside(template),
            name = this.name(inside),
            attr = inside.match(/\s(?:[-a-zA-Z0-9]+)(?:\s*=\s*(["'])(?:.*?)\1)?/g),
            outside = template.substr(template.indexOf('>') + 1);

        this._result += template.substr(0, template.indexOf('<'));
        if (name[1] === '-') {
            this.depth = 0;
            var start = template.indexOf('>') + 1,
                content = '',
                l;
            if (inside[inside.length - 1] === '/') {
                var n = name.length - 1;
                if (name[n] === '/') name = name.substr(0, n);
                l = -3 - name.length;
            } else {
                l = this.pair(outside, name);
                content = template.substr(start, l);
            }
            var len = start + 3 + l + name.length,
                letter = name.indexOf('__') === -1 ? 'b' : 'e';
            this._result += '{{&lt;}}? with ({' + letter + ':$.extend(true,' + this.stringify(attr) + ')}) { ?{{&gt;}}';
            this.step(this.before(this._get(name, '.start')) + content + this.before(this._get(name, '.end')) + '{{&lt;}}? } ?{{&gt;}}' + template.substr(len));
        } else if (name.length > 0) {
            this._result +=  '<' + (name[0] === '/' ? name : inside) + '>';
            this.step(outside);
        }
    },

    exec: function(template) {
        return (new Function('with({g:' + JSON.stringify(this._global) + '}) {var __s = \'\'; __s+=\'' + template.replace(/\n/g, '\\n').replace(/<\?(.*?)\?>/g, function(temp) {
            return '\'; ' + (temp[2] === '=' ? '__s+=' : '') + temp.replace(/^<\?=?|\?>$/g, '').replace(/\\n/g, '\n').replace(/\\'/g, '\'') + (temp[2] === '=' ? ';' : '') + ' __s+=\'';
        }) + '\'; return __s;}'))().replace(/\\n/g, '\n').replace(/}{}{&#39;}{}{/g, '\'').replace(/}{}{&quot;}{}{/g, '"');
    },

    render: function(template, global) {
        var result = '';
        this._global = global || {};
        try {
            result = this.exec(this.compile(template))
        } catch(e) {
            result = e;
        }
        return result;
    }
});
