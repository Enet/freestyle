(function() {
    var FlyModule = $.inherit({
        __init: function() {

        },

        __constructor: function(dom, options, flyId) {
            this._name = options.name;
            this._mods = options.mods;
            this._fly = flyId;
            this._elements = {};
            this.dom = dom || $({});
            if (typeof options.params !== 'undefined' && !(options.params instanceof Array)) options.params = [options.params];
            this.__init.apply(this, options.params || []);
            for (var m in this._mods) {
                this._modCallback(m, this._mods[m], '');
            }
        },

        breakFlow: function(callback, context) {
            var that = this;
            setTimeout(function() {
                callback.call(context || that);
            }, 0);
            return this;
        },

        getName: function() {
            return this._name;
        },

        getFly: function() {
            return this._fly;
        },

        getElem: function(name) {
            return this._elements[name] || this.findElem(name);
        },

        findElem: function(name) {
            var that = this;
            return this._elements[name] = this.dom.find('.' + this._name + '__' + name).filter(function(i, el) {
                if (that.dom[0].nodeType === 9 || $(el).closest('.' + that._name)[0] === that.dom[0]) return true;
            })
        },

        _detectElemMod: function(el, mod, elemName) {
            var cstring = el[0].className + ' ',
                modificator = cstring.indexOf(this._name + '__' + (elemName || this._detectElemName(el)) + '_' + mod + '_'),
                space = cstring.indexOf(' ', modificator);

            return ~modificator ? cstring.substring(modificator, space) : '';
        },

        _detectElemName: function(el) {
            var cstring = el[0].className + ' ',
                separator = cstring.indexOf(this._name + '__') + this._name.length + 2,
                space = cstring.indexOf(' ', separator),
                underline = cstring.indexOf('_', separator);

            return cstring.substring(separator, Math.min(~underline ? underline : Infinity, space));
        },

        _modCallback: function(mod, val, old) {
            if (val !== old && typeof this._onSetMod === 'object') {
                typeof this._onSetMod[mod] === 'function' && this._onSetMod[mod].call(this, mod, val, old);
                typeof this._onSetMod['*'] === 'function' && this._onSetMod['*'].call(this, mod, val, old);
            }
        },

        getMods: function() {
            return $.extend({}, this._mods);
        },

        hasMod: function(el, mod, val) {
            if (typeof el === 'string') {
                val = mod; mod = el;
                return typeof val === 'undefined' ? !!this._mods[mod] : this._mods[mod] === val;
            } else {
                var current = this.getMod(el, mod);
                return typeof val === 'undefined' ? !!current : current === val;
            }
        },

        getMod: function(el, mod) {
            if (typeof mod === 'undefined') {
                mod = el;
                return this._mods[mod] || '';
            } else {
                return this._detectElemMod(el, mod).split('_')[4] || '';
            }
        },

        delMod: function(el, mod) {
            if (typeof mod === 'undefined') {
                mod = el;
                return this.setMod(mod, '');
            } else {
                el.removeClass(this._detectElemMod(el, mod));
                return this;
            }
        },

        toggleMod: function(el, mod, vals) {
            var arr = [];
            if (typeof el === 'string') {
                vals = mod; mod = arr[0] = el;
            } else {
                arr.unshift(el, mod);
            }
            var index = vals.indexOf(this.getMod.apply(this, arr)) + 1;
            if (index === vals.length) index = 0;
            return this.setMod.apply(this, arr.push(vals[index]) && arr);
        },

        setMod: function(el, mod, val) {
            if (typeof el === 'string') {
                val = mod; mod = el; val += '';
                var old = this._mods[mod],
                    dom = this.dom.removeClass(this._name + '_' + mod + '_' + this._mods[mod]);
                (this._mods[mod] = val) && dom.addClass(this._name + '_' + mod + '_' + val);
                this._modCallback(mod, val, old);
            } else {
                var elName = this._detectElemName(el);
                el.removeClass(this._detectElemMod(el, mod, elName)).addClass(this._name + '__' + elName + '_' + mod + '_' + val);
            }
            return this;
        },


        kill: function() {
            this.dom.find('*[data-fly]').each(function(c, child) {
                fly.killInstance($(child).attr('data-fly'));
            });
            fly.killInstance(this._fly);
            return this;
        }
    });

    Fly = $.inherit({
        __constructor: function() {
            var that = this;
            this.side = 'client';
            this._maker = new Easy();
            this._templates = {};
            this._maker.getter(function(name, postfix) {
                return that._templates[name + postfix] || '';
            });
            this._modules = {};
            this._storage = [];
        },

        getStatic: function(moduleName) {
            return (this._modules[moduleName] || {}).staticPart || {};
        },

        loadModule: function(baseName, moduleName, instancePart, staticPart) {
            if (typeof moduleName !== 'string') {
                staticPart = instancePart;
                instancePart = moduleName;
                moduleName = baseName;
                baseName = null;
            }
            this._modules[moduleName] = {
                baseName: baseName,
                instancePart: instancePart,
                staticPart: staticPart
            };
            return this;
        },

        loadTemplate: function(name, content) {            
            var templates = typeof name === 'string' ? {name: content} : name;
            for (var t in templates) {
                if (t.substr(-6) === '.start') {
                    var letter = t.indexOf('__') === -1 ? 'b' : 'e';
                    templates[t] = [
                        '<? var name = "' + t.substring(0, t.lastIndexOf('.')) + '", mods = [name];',
                        'for (var m in ' + letter + ') {',
                        letter + '[m][0] === "@"',
                        '? (' + letter + '[m] = ' + letter + '[m].substr(1))',
                        ': (["string", "number", "boolean"].indexOf(typeof ' + letter + '[m]) !== -1',
                        '&& ' + letter + '[m] + "" !== ""',
                        '&& mods.push(m === "mix" ? ' + letter + '[m] : name + "_" + m + "_" + ' + letter + '[m]))',
                        '}; mods = mods.join(" "); ?>'
                    ].join(' ') + templates[t];
                }
            }
            $.extend(this._templates, templates);
            return this;
        },

        killInstance: function(flyId) {
            typeof this._storage[flyId].__destroy === 'function' && this._storage[flyId].__destroy();
            this._storage[flyId] = null;
            return this;
        },

        getInstance: function(flyId) {
            return this._storage[flyId];
        },

        wrapContent: function(block, options) {
            options = options || {};
            var content = options.content || '';
            delete options.content;
            return '<' + block + ' onclick=\'' + (JSON.stringify(options || {})).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '\\\'') + '\'>' + content + '</' + block + '>';
        },

        initInstance: function(dom, options) {
            if (typeof options === 'string') options = {name: options};
            var mods = {};
            if (dom && dom.length) {
                var clist = dom.classList();
                for (var c = 0; c < clist.length; c++) {
                    var cname = clist[c],
                        elem = cname.indexOf('__'),
                        start = cname.indexOf('_', elem + 2),
                        finish = cname.indexOf('_', start + 1);
                    if (~start && ~finish && cname.substr(0, ~elem ? elem : start) === options.name) {
                        mods[cname.substring(start + 1, finish)] = cname.substr(finish + 1);
                    }
                }
                for (var m in options.mods) {
                    var cname = options.name + '_' + m + '_' + options.mods[m];
                    if (clist.indexOf(cname)) dom.addClass(cname);
                }
            }
            return this._createInstance(dom, $.extend({mods: mods}, options));
        },

        _createInstance: function(dom, options) {
            var flyId = this._storage.length,
                parent = FlyModule,
                series = [],
                base = this._modules[options.name];
            typeof base !== 'undefined' && series.push(options.name);
            while (typeof base !== 'undefined' && base.baseName !== null) {
                series.unshift(base.baseName);
                base = this._modules[base.baseName];
            }
            for (var m in options.mods) {
                var cname = options.name + '_' + m + '_' + options.mods[m];
                if (typeof this._modules[cname] !== 'undefined') series.push(cname);
            }
            for (var s = 0; s < series.length; s++) {
                parent = $.inherit(parent, this._modules[series[s]].instancePart, this._modules[series[s]].staticPart);
            }
            dom && dom.attr('data-fly', flyId);
            return (this._storage[flyId] = true) && (this._storage[flyId] = new parent(dom, options, flyId));
        },

        render: function(template, dataObject, block) {
            return this._maker.render(template, dataObject, block);
        }
    });

    fly = new Fly();
})();

(function($) {
    $.fn.fly = function() {
        return fly.getInstance($(this).attr('data-fly'));
    };

    $.fn.classList = function() {
        var r = [];
        this.each(function(i, v) {
            var cn = (v.className || '').split(/\s+/), w = {};
            for(var c in cn) {
                '' === cn[c] || (w[c] !== true && r.push(cn[c]) && (w[c] = true));
            }
        });
        return r;
    };

    $.fn.flyficate = function(options) {
        return this.map(function(i, v) {
            return fly.initInstance($(v), options);
        });
    };
})(jQuery);
