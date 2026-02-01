/**
 * PrismJS - Lightweight Syntax Highlighter
 * Minimal version with common languages
 */

/* PrismJS 1.29.0 (minimal) */
var Prism = (function () {
  var _self = (typeof window !== 'undefined') ? window : (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) ? self : {};
  var Prism = (function (_self) {
    var lang = /\blang(?:uage)?-([\w-]+)\b/i;
    var uniqueId = 0;
    var _ = {
      manual: _self.Prism && _self.Prism.manual,
      disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
      util: {
        encode: function encode(tokens) {
          if (tokens instanceof Token) {
            return new Token(tokens.type, encode(tokens.content), tokens.alias);
          } else if (Array.isArray(tokens)) {
            return tokens.map(encode);
          } else {
            return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
          }
        },
        type: function (o) {
          return Object.prototype.toString.call(o).slice(8, -1);
        },
        objId: function (obj) {
          if (!obj['__id']) {
            Object.defineProperty(obj, '__id', { value: ++uniqueId });
          }
          return obj['__id'];
        },
        clone: function deepClone(o, visited) {
          visited = visited || {};
          var clone, id;
          switch (_.util.type(o)) {
            case 'Object':
              id = _.util.objId(o);
              if (visited[id]) {
                return visited[id];
              }
              clone = {};
              visited[id] = clone;
              for (var key in o) {
                if (o.hasOwnProperty(key)) {
                  clone[key] = deepClone(o[key], visited);
                }
              }
              return clone;
            case 'Array':
              id = _.util.objId(o);
              if (visited[id]) {
                return visited[id];
              }
              clone = [];
              visited[id] = clone;
              o.forEach(function (v, i) {
                clone[i] = deepClone(v, visited);
              });
              return clone;
            default:
              return o;
          }
        },
        getLanguage: function (element) {
          while (element && !lang.test(element.className)) {
            element = element.parentElement;
          }
          if (element) {
            return (element.className.match(lang) || [, 'none'])[1].toLowerCase();
          }
          return 'none';
        },
        currentScript: function () {
          if (typeof document === 'undefined') {
            return null;
          }
          if ('currentScript' in document && 1 < 2) {
            return document.currentScript;
          }
          try {
            throw new Error();
          } catch (err) {
            var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
            if (src) {
              var scripts = document.getElementsByTagName('script');
              for (var i in scripts) {
                if (scripts[i].src == src) {
                  return scripts[i];
                }
              }
            }
            return null;
          }
        },
        isActive: function (element, className, defaultActivation) {
          className = ' ' + className + ' ';
          while (element) {
            var classList = element.classList;
            if (classList.contains(className.trim())) {
              return true;
            }
            element = element.parentElement;
          }
          return defaultActivation;
        }
      },
      languages: {
        extend: function (id, redef) {
          var lang = _.util.clone(_.languages[id]);
          for (var key in redef) {
            lang[key] = redef[key];
          }
          return lang;
        },
        insertBefore: function (inside, before, insert, root) {
          root = root || _.languages;
          var grammar = root[inside];
          var ret = {};
          for (var token in grammar) {
            if (grammar.hasOwnProperty(token)) {
              if (token == before) {
                for (var newToken in insert) {
                  if (insert.hasOwnProperty(newToken)) {
                    ret[newToken] = insert[newToken];
                  }
                }
              }
              if (!insert.hasOwnProperty(token)) {
                ret[token] = grammar[token];
              }
            }
          }
          var old = root[inside];
          root[inside] = ret;
          _.languages.DFS(_.languages, function (key, value) {
            if (value === old && key != inside) {
              this[key] = ret;
            }
          });
          return ret;
        },
        DFS: function DFS(o, callback, type, visited) {
          visited = visited || {};
          var objId = _.util.objId;
          for (var i in o) {
            if (o.hasOwnProperty(i)) {
              callback.call(o, i, o[i], type || i);
              var property = o[i];
              var propertyType = _.util.type(property);
              if (propertyType === 'Object' && !visited[objId(property)]) {
                visited[objId(property)] = true;
                DFS(property, callback, null, visited);
              } else if (propertyType === 'Array' && !visited[objId(property)]) {
                visited[objId(property)] = true;
                DFS(property, callback, i, visited);
              }
            }
          }
        }
      },
      plugins: {},
      highlightAll: function (async, callback) {
        _.highlightAllUnder(document, async, callback);
      },
      highlightAllUnder: function (container, async, callback) {
        var env = {
          callback: callback,
          container: container,
          selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
        };
        _.hooks.run('before-highlightall', env);
        env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));
        _.hooks.run('before-all-elements-highlight', env);
        for (var i = 0, element; element = env.elements[i++];) {
          _.highlightElement(element, async === true, env.callback);
        }
      },
      highlightElement: function (element, async, callback) {
        var language = _.util.getLanguage(element);
        var grammar = _.languages[language];
        element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
        var parent = element.parentElement;
        if (parent && parent.nodeName.toLowerCase() === 'pre') {
          parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
        }
        var code = element.textContent;
        var env = {
          element: element,
          language: language,
          grammar: grammar,
          code: code
        };
        function insertHighlightedCode(highlightedCode) {
          env.highlightedCode = highlightedCode;
          _.hooks.run('before-insert', env);
          env.element.innerHTML = env.highlightedCode;
          _.hooks.run('after-highlight', env);
          _.hooks.run('complete', env);
          callback && callback.call(env.element);
        }
        _.hooks.run('before-sanity-check', env);
        if (!env.code) {
          _.hooks.run('complete', env);
          callback && callback.call(env.element);
          return;
        }
        _.hooks.run('before-highlight', env);
        if (!env.grammar) {
          insertHighlightedCode(_.util.encode(env.code));
          return;
        }
        if (async && _self.Worker) {
          var worker = new Worker(_.filename);
          worker.onmessage = function (evt) {
            insertHighlightedCode(evt.data);
          };
          worker.postMessage(JSON.stringify({
            language: env.language,
            code: env.code,
            immediateClose: true
          }));
        } else {
          insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
        }
      },
      highlight: function (text, grammar, language) {
        var env = {
          code: text,
          grammar: grammar,
          language: language
        };
        _.hooks.run('before-tokenize', env);
        env.tokens = _.tokenize(env.code, env.grammar);
        _.hooks.run('after-tokenize', env);
        return Token.stringify(_.util.encode(env.tokens), env.language);
      },
      tokenize: function (text, grammar) {
        var rest = grammar.rest;
        if (rest) {
          for (var token in rest) {
            grammar[token] = rest[token];
          }
          delete grammar.rest;
        }
        var tokenList = new LinkedList();
        addAfter(tokenList, tokenList.head, text);
        tokenizeWithHooks(text, grammar, tokenList, 0);
        return toArray(tokenList);
      },
      hooks: {
        all: {},
        add: function (name, callback) {
          var hooks = _.hooks.all;
          hooks[name] = hooks[name] || [];
          hooks[name].push(callback);
        },
        run: function (name, env) {
          var callbacks = _.hooks.all[name];
          if (!callbacks || !callbacks.length) {
            return;
          }
          for (var i = 0, callback; callback = callbacks[i++];) {
            callback(env);
          }
        }
      },
      Token: Token
    };
    _self.Prism = _;
    function Token(type, content, alias, matchedStr) {
      this.type = type;
      this.content = content;
      this.alias = alias;
      this.length = (matchedStr || '').length | 0;
    }
    Token.stringify = function stringify(o, language) {
      if (typeof o == 'string') {
        return o;
      }
      if (Array.isArray(o)) {
        var s = '';
        o.forEach(function (e) {
          s += stringify(e, language);
        });
        return s;
      }
      var env = {
        type: o.type,
        content: stringify(o.content, language),
        tag: 'span',
        classes: ['token', o.type],
        attributes: {},
        language: language
      };
      var aliases = o.alias;
      if (aliases) {
        if (Array.isArray(aliases)) {
          Array.prototype.push.apply(env.classes, aliases);
        } else {
          env.classes.push(aliases);
        }
      }
      _.hooks.run('wrap', env);
      var attributes = '';
      for (var name in env.attributes) {
        attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
      }
      return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    };
    function matchPattern(pattern, pos, text, lookbehind) {
      pattern.lastIndex = pos;
      var match = pattern.exec(text);
      if (match && lookbehind && match[1]) {
        var from = match.index - 1;
        match.index = from;
        match[0] = text.slice(from, match.index + match[0].length);
      }
      return match;
    }
    function LinkedList() {
      var head = { value: null, prev: null, next: null };
      var tail = { value: null, prev: head, next: null };
      head.next = tail;
      this.head = head;
      this.tail = tail;
      this.length = 0;
    }
    function addAfter(list, node, value) {
      var next = node.next;
      var newNode = { value: value, prev: node, next: next };
      node.next = newNode;
      next.prev = newNode;
      list.length++;
      return newNode;
    }
    function removeRange(list, node, count) {
      var next = node.next;
      for (var i = 0; i < count && next !== list.tail; i++) {
        next = next.next;
      }
      node.next = next;
      next.prev = node;
      list.length -= i;
    }
    function toArray(list) {
      var array = [];
      var node = list.head.next;
      while (node !== list.tail) {
        array.push(node.value);
        node = node.next;
      }
      return array;
    }
    function tokenizeWithHooks(text, grammar, tokenList, startNode) {
      for (var token in grammar) {
        if (!grammar.hasOwnProperty(token) || !grammar[token]) {
          continue;
        }
        var patterns = grammar[token];
        patterns = Array.isArray(patterns) ? patterns : [patterns];
        for (var j = 0; j < patterns.length; ++j) {
          var lookbehind = !!patterns[j].lookbehind;
          var greedy = !!patterns[j].greedy;
          var lookbehindLength = 0;
          var alias = patterns[j].alias;
          if (greedy && !patterns[j].pattern.global) {
            var flags = patterns[j].pattern.toString().match(/[imsuy]*$/)[0];
            patterns[j].pattern = RegExp(patterns[j].pattern.source, flags + 'g');
          }
          var pattern = patterns[j].pattern || patterns[j];
          for (var currentNode = startNode.next, pos = 0; currentNode !== tokenList.tail; pos += currentNode.value.length, currentNode = currentNode.next) {
            if (tokenList.length > text.length) {
              return;
            }
            var str = currentNode.value;
            if (tokenList.length > text.length || str.length === 0) {
              continue;
            }
            var removeCount = 1;
            var match;
            if (greedy) {
              match = matchPattern(pattern, pos, text, lookbehind);
              if (!match || match.index >= text.length) {
                break;
              }
              var from = match.index + (lookbehind && match[1] ? match[1].length : 0);
              var to = match.index + match[0].length;
              var p = pos;
              p += currentNode.value.length;
              while (from >= p) {
                currentNode = currentNode.next;
                p += currentNode.value.length;
              }
              p -= currentNode.value.length;
              pos = p;
              if (currentNode.value.length === 0) {
                continue;
              }
              var k = 1;
              for (var el = currentNode; el.next !== tokenList.tail && p < to; ++k) {
                el = el.next;
                p += el.value.length;
              }
              removeCount = k;
              str = text.slice(pos, p);
              match.index -= pos;
            } else {
              match = matchPattern(pattern, 0, str, lookbehind);
            }
            if (!match) {
              continue;
            }
            if (lookbehind) {
              lookbehindLength = match[1] ? match[1].length : 0;
            }
            var from = match.index + lookbehindLength;
            var matchStr = match[0].slice(lookbehindLength);
            var to = from + matchStr.length;
            var before = str.slice(0, from);
            var after = str.slice(to);
            var reach = pos + str.length;
            if (removeCount > 1) {
              removeRange(tokenList, currentNode.prev, removeCount - 1);
            }
            var wrapped = new Token(token, matchStr, alias, matchStr);
            currentNode = addAfter(tokenList, currentNode.prev, before);
            currentNode = addAfter(tokenList, currentNode, wrapped);
            currentNode = addAfter(tokenList, currentNode, after);
            if (removeCount > 1) {
              tokenizeWithHooks(text, grammar, tokenList, currentNode.prev);
            }
          }
        }
      }
    }
    return _;
  })(_self);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Prism;
  }
  if (typeof global !== 'undefined') {
    global.Prism = Prism;
  }
  return Prism;
})();

// Language definitions
Prism.languages.markup = {
  comment: /<!--[\s\S]*?-->/,
  prolog: /<\?[\s\S]*?\?>/,
  doctype: {
    pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    greedy: true,
    inside: {
      'internal-subset': {
        pattern: /(^\[)[\s\S]+(?=\]>$)/,
        lookbehind: true,
        greedy: true,
        inside: null
      },
      string: {
        pattern: /"[^"]*"|'[^']*'/,
        greedy: true
      },
      punctuation: /^<!|>$|[[\]]/,
      'doctype-tag': /^DOCTYPE/i,
      name: /[^\s<>'"]+/
    }
  },
  cdata: /<!\[CDATA\[[\s\S]*?\]\]>/i,
  tag: {
    pattern: /<\/?(?:[^<>"'\s/]|\s+(?=[^<>"'\s/])|"[^"]*"|'[^']*')+\/?>/,
    greedy: true,
    inside: {
      tag: {
        pattern: /^<\/?[^\s>/]+/,
        inside: {
          punctuation: /^<\/?/,
          namespace: /^[^\s>:/]+:/
        }
      },
      'special-attr': [],
      'attr-value': {
        pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/i,
        inside: {
          punctuation: [
            /^=/,
            {
              pattern: /^(\s*)["']|["']$/,
              lookbehind: true
            }
          ]
        }
      },
      punctuation: /\/?>/,
      'attr-name': {
        pattern: /[^\s>/]+/,
        inside: {
          namespace: /^[^\s>:/]+:/
        }
      }
    }
  },
  entity: [
    {
      pattern: /&[\da-z]{1,8};/i,
      alias: 'named-entity'
    },
    /&#x?[\da-f]{1,8};/i
  ]
};

Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.xml = Prism.languages.extend('markup', {});
Prism.languages.ssml = Prism.languages.xml;
Prism.languages.atom = Prism.languages.xml;
Prism.languages.rss = Prism.languages.xml;

Prism.languages.javascript = {
  comment: [
    /\/\/[\s\S]*/,
    /\/\*[\s\S]*?\*\//,
    /#(?!!\[).*/
  ],
  'template-string': {
    pattern: /`(?:\\[\s\S]|\$\{[^}]*\}|[^\\`])*`/,
    greedy: true,
    inside: {
      interpolation: {
        pattern: /\$\{[^}]*\}/,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\$\{|\}$/,
            alias: 'punctuation'
          },
          rest: Prism.languages.javascript
        }
      },
      string: /[\s\S]+/
    }
  },
  string: {
    pattern: /'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*'|"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"/,
    greedy: true
  },
  'class-name': [
    {
      pattern: /((?:\b(?:class|interface|extends|implements|instanceof|new)\s+)|(?:catch\s+\())[\w.\\]+/i,
      lookbehind: true,
      inside: {
        punctuation: /[.\\]/
      }
    },
    {
      pattern: /\b(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b)[A-Za-z$_][\w$]*\b/,
      alias: 'class-name'
    }
  ],
  keyword: /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
  boolean: /\b(?:true|false)\b/,
  function: /\b[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?=\s*\()/,
  number: /\b(?:(?:0[xX](?:[\da-fA-F](?:_[\da-fA-F])?)+|0[bB](?:[01](?:_[01])?)+|0[oO](?:[0-7](?:_[0-7])?)+)n?|(?:\d(?:_\d)?)+n|NaN|Infinity)\b|(?:\b(?:\d(?:_\d)?)+\.?(?:\d(?:_\d)?)*|\B\.(?:\d(?:_\d)?)+)(?:[Ee][+-]?(?:\d(?:_\d)?)+)?/,
  operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
  punctuation: /\.{3}|\{|\}|\[|\]|\(|\)|[;:,.]/
};

Prism.languages.js = Prism.languages.javascript;

Prism.languages.css = {
  comment: /\/\*[\s\S]*?\*\//,
  atrule: {
    pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
    inside: {
      rule: /^@[\w-]+/,
      'selector-function-argument': {
        pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
        lookbehind: true,
        alias: 'selector'
      },
      identifier: {
        pattern: /#(?![\{\.])[\w-]+/,
        alias: 'keyword'
      }
    }
  },
  url: {
    pattern: /url\((?:("|')(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1|[^\n\r()]*?)\)/i,
    greedy: true,
    inside: {
      function: /^url/i,
      punctuation: /^\(|\)$/,
      string: {
        pattern: /^("|')[\s\S]+\1$/,
        alias: 'url'
      }
    }
  },
  selector: {
    pattern: /(^|[{}\s])[^{}\s](?:[^{};"'\s]|\s+(?![\s{])|"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*')*(?=\s*\{)/m,
    lookbehind: true
  },
  string: {
    pattern: /"(?:[^"\\\r\n]|\\.)*"|'(?:[^'\\\r\n]|\\.)*'/,
    greedy: true
  },
  property: {
    pattern: /(^|[^-\w\xa0-\uffff])(?!\s)[-_a-z\xa0-\uffff](?:(?!\s)[-\w\xa0-\uffff])*(?=\s*:)/i,
    lookbehind: true
  },
  important: /!important\b/i,
  function: {
    pattern: /\b[-a-z]\w*(?=\()/i,
    alias: 'function'
  },
  punctuation: /[(){};:,]/
};

Prism.languages.css['atrule'].inside.rest = Prism.languages.css;

Prism.languages.json = {
  property: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    lookbehind: true,
    greedy: true
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"/,
    lookbehind: true,
    greedy: true
  },
  comment: {
    pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
    greedy: true
  },
  number: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i,
  punctuation: /[{}[\],]/,
  operator: /:/,
  boolean: /\b(?:true|false)\b/,
  null: {
    pattern: /\bnull\b/,
    alias: 'keyword'
  }
};

Prism.languages.markdown = Prism.languages.extend('markup', {});
Prism.languages.insertBefore('markdown', 'prolog', {
  blockquote: {
    pattern: /^>(?:[\t ]*>)*\s.+/m,
    alias: 'punctuation'
  },
  code: [
    {
      pattern: /^(?: {4}|\t).+/m,
      alias: 'keyword'
    },
    {
      pattern: /``.+?``|`[^`\n]+`/,
      alias: 'keyword'
    },
    {
      pattern: /^```[\s\S]*?^```$/m,
      greedy: true,
      inside: {
        'code-block': {
          pattern: /^(```.*(?:\r?\n|(?![\s\S])))[\s\S]*?(?=(?:```$|^))/m,
          lookbehind: true
        },
        'code-language': {
          pattern: /^(```).+/,
          lookbehind: true
        },
        punctuation: /^```|```$/
      }
    }
  ],
  title: [
    {
      pattern: /\S.*(?:\r?\n|\r)(?:==+|--+)/,
      alias: 'important',
      inside: {
        punctuation: /==+$|--+$/
      }
    },
    {
      pattern: /(^.\s*)#{1,6}.+/m,
      lookbehind: true,
      alias: 'important',
      inside: {
        punctuation: /^!{0,3}/
      }
    }
  ],
  hr: {
    pattern: /(^.\s*)([*-])(?:[\t ]*\2){2,}(?=\s*$)/m,
    lookbehind: true,
    alias: 'punctuation'
  },
  list: {
    pattern: /(^.\s*)(?:[*+-]|\d+\.)(?=\s)/m,
    lookbehind: true,
    alias: 'punctuation'
  },
  'url-reference': {
    pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
    inside: {
      variable: {
        pattern: /^!?\[[^\]]+\]/,
        alias: 'string'
      },
      string: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/,
      punctuation: /^[\[\]!:]|[<>]/
    },
    alias: 'url'
  },
  bold: {
    pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: true,
    greedy: true,
    inside: {
      punctuation: /^\*\*|^__|\*\*$|__$/
    }
  },
  italic: {
    pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: true,
    greedy: true,
    inside: {
      punctuation: /^[*_]|[*_]$/
    }
  },
  strike: {
    pattern: /(^|[^\\])(~~)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: true,
    greedy: true,
    inside: {
      punctuation: /^~~|~~$/
    }
  },
  'code-snippet': {
    pattern: /(^|[^\\`])(`+)(?:[^`]|[^`\r\n]|\r(?!\n))*?\2(?!`)/,
    lookbehind: true,
    greedy: true,
    alias: 'keyword'
  },
  url: {
    pattern: /\bhttps?:\/\/[\w\/+#%&.?~@:-]+/,
    greedy: true,
    inside: {
      punctuation: /[.:?#]/
    }
  },
  email: {
    pattern: /\b[\w.+-]+@[\w.-]+\.\w+\b/,
    alias: 'url'
  }
});

Prism.languages.md = Prism.languages.markdown;

// TypeScript
Prism.languages.typescript = Prism.languages.extend('javascript', {
  'class-name': {
    pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)[_$a-zA-Z\xA0-\uFFFF][$\w\xA0-\uFFFF]*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
    lookbehind: true,
    greedy: true,
    inside: null
  },
  keyword: /\b(?:abstract|as|asserts|async|await|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|new|null|of|package|private|protected|public|readonly|return|require|set|static|super|switch|this|throw|try|type|typeof|undefined|unique|var|void|while|with|yield)\b/
});

Prism.languages.ts = Prism.languages.typescript;

// Bash/Shell
Prism.languages.bash = {
  shebang: {
    pattern: /^#![\s\S]+$/m,
    greedy: true,
    alias: 'keyword'
  },
  comment: {
    pattern: /(^|[^"'\\])#.*/,
    lookbehind: true
  },
  'assignment-lhs': {
    pattern: /(^|[\s;|&]|[<>]\()\w+(?=\s*=)/,
    lookbehind: true,
    alias: 'variable'
  },
  string: [
    {
      pattern: /((?:^|[<>]\()\s*\$?")[^"]*(?:""[^"]*)*"/,
      lookbehind: true,
      greedy: true,
      inside: {
        property: {
          pattern: /\$\{(?:[^'"\\]|\\.)*\}/,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation'
            },
            rest: Prism.languages.bash
          }
        }
      }
    },
    {
      pattern: /(^|[<>]\()\s*\$?'[^']*'/,
      lookbehind: true,
      greedy: true
    },
    {
      pattern: /"[^"]*(?:""[^"]*)*"/,
      greedy: true,
      inside: {
        property: {
          pattern: /\$\{(?:[^'"\\]|\\.)*\}/,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\$\{|\}$/,
              alias: 'punctuation'
            },
            rest: Prism.languages.bash
          }
        }
      }
    },
    {
      pattern: /'[^']*'/,
      greedy: true
    }
  ],
  environment: {
    pattern: /\$\w+|\$\{[^\}]*\}/,
    alias: 'variable'
  },
  function: /\w+(?=\s*\()/,
  number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+/i,
  operator: /\|\|?|&&?|;-|;;|<\||<\(|\|>|\(\)|\(\(\)|\)|\[\]|\{\}|\+|-|\*|\^|!|=|~|<|>|\/|%|&/,
  punctuation: /\$?\(\)|\$?\{\}|\[\]|;/,
  keyword: /\b(?:if|then|else|elif|fi|for|while|in|do|done|case|esac|function|select|time|until|coproc|exec|shift|exit|return|break|continue|trap|wait|eval|source|export|unset|readonly|local|declare|typeset|enable|builtin|mapfile|readarray|true|false|test)\b/
};

Prism.languages.sh = Prism.languages.bash;
Prism.languages.shell = Prism.languages.bash;

// Initialize on DOM ready
(function() {
  'use strict';
  
  function init() {
    if (typeof Prism !== 'undefined') {
      Prism.highlightAll();
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
