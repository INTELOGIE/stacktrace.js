/*global module, test, equals, expect, ok, printStackTrace*/
//
//     Copyright (C) 2008 Loic Dachary <loic@dachary.org>
//     Copyright (C) 2008 Johan Euphrosine <proppy@aminche.com>
//     Copyright (C) 2010 Eric Wendelin <emwendelin@gmail.com>
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU General Public License as published by
//     the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU General Public License for more details.
//
//     You should have received a copy of the GNU General Public License
//     along with this program.  If not, see <http://www.gnu.org/licenses/>.
//

(function(window, document, undefined) {
  var pst = printStackTrace.implementation.prototype;
  // Testing util functions
  var UnitTest = function() {
  };
  UnitTest.fn = UnitTest.prototype = {
    genericError: null,
    createGenericError: function() {
      if (UnitTest.prototype.genericError != null) {
        return UnitTest.prototype.genericError;
      }
      return new Error();
    },
    /**
     * An Error Chrome without arguments will emulate a Firefox
     */
    createErrorWithNoChromeArguments: function() {
      var err, options = {};
      try {
        var oEvent = document.createEvent("KeyEvents");
        oEvent.initKeyEvent(eventName, true, true, window, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.keyCode, options.charCode);
      } catch (e) {
        err = e;
      }
      return err;
    }
  };

  module("invocation");

  test("printStackTrace", function() {
    expect(1);
    var r = printStackTrace();
    equals(r.constructor, Array, 'printStackTrace returns an array');
  });

  test("printStackTrace options", function() {
    expect(1);
    var guessAnonymousFunctions = pst.guessAnonymousFunctions;
    pst.guessAnonymousFunctions = function() {
      pst.guessAnonymousFunctions = guessAnonymousFunctions;
      ok(true, 'guessAnonymousFunctions called');
    };
    var r = printStackTrace({
      guess: true
    });
  });

  module("mode");

  test("mode", function() {
    expect(1);
    equals("chrome firefox other opera opera10".indexOf(pst.mode(UnitTest.fn.createGenericError())) >= 0, true);
  });

  test("run mode", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.other = p.firefox = p.chrome = p.opera = p.opera10 = function() {
      equals(1, 1, 'called mode() successfully');
    };
    p.run();
  });

  test("run chrome", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.other = p.opera = p.opera10 = p.firefox = function() {
      equals(1, 0, 'must not call run for any mode other than "chrome"');
    };
    p.chrome = function() {
      equals(1, 1, 'called run for "chrome"');
    };
    p.run({
      'arguments': true,
      stack: 'ignored\n at f0 (file.js:132:3)\n at file.js:135:3\n at f1 (file.js:132:13)\n at file.js:135:23\n at Object.<anonymous> (file.js:137:9)\n at file.js:137:32 at process (file.js:594:22)'
    });
  });

  test("run firefox", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.other = p.opera = p.opera10 = p.chrome = function() {
      equals(1, 0, 'must not call run for any mode other than "firefox"');
    };
    p.firefox = function() {
      equals(1, 1, 'called run for "firefox"');
    };
    p.run({
      stack: 'f1(1,"abc")@file.js:40\n()@file.js:41\n@:0  \nf44()@file.js:494'
    });
  });

  test("run opera", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.opera10 = p.other = p.firefox = p.chrome = function() {
      equals(1, 0, 'must not call run for any mode other than "opera"');
    };
    p.opera = function() {
      equals(1, 1, 'called run for "opera"');
    };
    if (typeof window !== 'undefined' && !window.opera) {
      window.opera = "fake";
      window.fakeOpera = true;
    }
    p.run({
      message: 'ignored\nignored\nignored\nignored\nLine 40 of linked script http://site.com: in function f1\n      discarded()\nLine 44 of linked script http://site.com\n     f1(1, "abc")\nignored\nignored'
    });
    if (window.fakeOpera) {
      delete window.opera;
      delete window.fakeOpera;
    }
  });

  test("run opera10", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.opera = p.other = p.firefox = p.chrome = function() {
      equals(1, 0, 'must not be called');
    };
    p.opera10 = function() {
      equals(1, 1, 'called run for "opera10"');
    };
    if (typeof window !== 'undefined' && !window.opera) {
      window.opera = "fake";
      window.fakeOpera = true;
    }
    p.run({
      message: 'ignored',
      stack: 'ignored\nf1([arguments not available])@http://site.com/main.js:2\n<anonymous function: f2>([arguments not available])@http://site.com/main.js:4\n@',
      stacktrace: 'ignored\nError thrown at line 129, column 5 in <anonymous function>():\nignored\nError thrown at line 129, column 5 in <anonymous function>():\nignored\nError thrown at line 124, column 4 in <anonymous function>():\nignored\nError thrown at line 594, column 2 in process():\nignored\nError thrown at line 124, column 4 in <anonymous function>():\nignored\nError thrown at line 1, column 55 in discarded():\n    this.undef();\ncalled from line 1, column 333 in f1(arg1, arg2):\n   discarded();\ncalled from line 1, column 470 in <anonymous function>():\n   f1(1, "abc");\ncalled from line 1, column 278 in program code:\n   f2();'
    });
    if (window.fakeOpera) {
      delete window.opera;
      delete window.fakeOpera;
    }
  });

  test("run other", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    //p._mode = 'other';
    p.opera = p.opera10 = p.firefox = p.chrome = function() {
      equals(1, 0, 'must not be called');
    };
    p.other = function() {
      equals(1, 1, 'called run for other browser');
    };
    p.run({});
  });

  test("function instrumentation", function() {
    expect(4);
    this.toInstrument = function() {
      equals(1, 1, 'called instrumented function');
    };
    this.callback = function(stacktrace) {
      ok(typeof stacktrace !== 'undefined', 'called callback');
    };
    pst.instrumentFunction(this, 'toInstrument', this.callback);
    ok(this.toInstrument._instrumented, 'function instrumented');
    this.toInstrument();
    pst.deinstrumentFunction(this, 'toInstrument');
    ok(!this.toInstrument._instrumented, 'function deinstrumented');
    this.toInstrument = this.callback = null;
  });

  test("firefox", function() {
    var mode = pst.mode(UnitTest.fn.createErrorWithNoChromeArguments());
    var e = [];
    e.push({
      stack: 'f1(1,"abc")@file.js:40\n()@file.js:41\n@:0  \nf44()@file.js:494'
    });
    if (mode == 'firefox') {
      function f1(arg1, arg2) {
        try {
          this.undef();
        } catch (exception) {
          e.push(exception);
        }
      }
      var f2 = function() {
        f1(1, "abc");
      };
      f2();
    }
    expect(3 * e.length);
    for (var i = 0; i < e.length; i++) {
      var stack = pst.firefox(e[i]);
      //equals(stack.join("\n"), '', 'debug');
      equals(stack[0].indexOf('f1(1,"abc")') >= 0, true, 'f1');
      equals(stack[1].indexOf('{anonymous}()@') >= 0, true, 'f2 anonymous');
      equals(stack[2].indexOf('@:0'), -1, '@:0 discarded');
    }
  });

  test("chrome stack", function() {
    var e = {
      stack: "TypeError: Object #<Object> has no method 'undef'\n" +
      "    at Object.createException (stacktrace.js:81:18)\n" +
      "    at Object.run (stacktrace.js:66:25)\n" +
      "    at printStackTrace (stacktrace.js:57:62)\n" +
      "    at instrumented (stacktrace.js:114:33)\n" +
      "    at bar (testcase4.html:36:9)\n" +
      "    at testcase4.html:41:9\n" +
      "    at testcase4.html:48:7"
    };

    expect(8);
    var message = pst.chrome(e);
    // equals(message.join("\n"), '', 'debug');
    equals(message.length, 7, '7 stack entries');

    equals(message[0].indexOf('Object.createException') >= 0, true, 'Object.createException: ' + message[0]);
    equals(message[1].indexOf('Object.run') >= 0, true, 'Object.run: ' + message[1]);
    equals(message[2].indexOf('printStackTrace') >= 0, true, 'printStackTrace: ' + message[2]);
    equals(message[3].indexOf('instrumented') >= 0, true, 'instrumented: ' + message[3]);
    equals(message[4].indexOf('bar') >= 0, true, 'bar: ' + message[4]);
    equals(message[5].indexOf('{anonymous}') >= 0, true, '{anonymous}: ' + message[5]);
    equals(message[6].indexOf('{anonymous}') >= 0, true, '{anonymous}: ' + message[6]);
  });

  test("chrome", function() {
    var e = [], ex;

    var stack = "TypeError: Object [object DOMWindow] has no method 'undef'\n" +
    "    at f0 (test/test-stacktrace.js:198:20)\n" +
    "    at f1 (test/test-stacktrace.js:203:10)\n" +
    "    at test/test-stacktrace.js:206:10\n" +
    "    at Object.<anonymous> (test/test-stacktrace.js:208:6)\n" +
    "    at Object.run (test/qunit.js:89:18)\n" +
    "    at test/qunit.js:214:10\n" +
    "    at process (test/qunit.js:783:23)\n" +
    "    at test/qunit.js:383:5";
    e.push({
      stack: stack
    }); // test saved Chrome stacktrace
    function f0() {
      try {
        this.undef();
      } catch (exception) {
        ex = exception;
      }
    }
    function f1(arg1, arg2) {
      f0();
    }
    var f2 = function() {
      f1(1, "abc");
    };
    f2();
    if (pst.mode(ex) == 'chrome') {
      e.push(ex);
    } // test native Chrome stacktrace
    expect(3 * e.length);
    for (var i = 0; i < e.length; i++) {
      var message = pst.chrome(e[i]);
      //equals(e[i].stack, '', 'original stack trace');
      //equals(message.join("\n"), '', 'processed stack trace');
      equals(message[0].indexOf('f0') >= 0, true, 'f0 is top of stack');
      equals(message[1].indexOf('f1') >= 0, true, 'f1 is second called function');
      equals(message[2].indexOf('anonymous') >= 0, true, 'f2 anonymous function called');
      //equals(message[3].indexOf('unknown source'), -1, 'unknown source discarded');
    }
  });

  test("opera10", function() {
    var mode = pst.mode(UnitTest.fn.createGenericError());
    var e = [];
    e.push({
      stack: 'ignored\nf1([arguments not available])@http://site.com/main.js:2\n<anonymous function: f2>([arguments not available])@http://site.com/main.js:4\n@',
      stacktrace: 'ignored\nError thrown at line 129, column 5 in <anonymous function>():\nignored\nError thrown at line 129, column 5 in <anonymous function>():\nignored\nError thrown at line 124, column 4 in <anonymous function>():\nignored\nError thrown at line 594, column 2 in process():\nignored\nError thrown at line 124, column 4 in <anonymous function>():\nignored\nError thrown at line 1, column 55 in discarded():\n    this.undef();\ncalled from line 1, column 333 in f1(arg1, arg2):\n   discarded();\ncalled from line 1, column 470 in <anonymous function>():\n   f1(1, "abc");\ncalled from line 1, column 278 in program code:\n   f2();'
    });
    if (mode == 'opera10') {
      function discarded() {
        try {
          this.undef();
        } catch (exception) {
          e.push(exception);
        }
      }
      function f1(arg1, arg2) {
        var blah = arg1;
        discarded();
      }
      var f2 = function() {
        f1(1, "abc");
      };
      f2();
    }
    expect(3 * e.length);
    for (var i = 0; i < e.length; i++) {
      var stack = pst.opera10(e[i]), stack_string = stack.join('\n');
      //equals(stack_string, '', 'debug');
      equals(stack_string.indexOf('ignored'), -1, 'ignored');
      equals(stack[5].indexOf('f1(') >= 0, true, 'f1 function name: ' + stack[5]);
      equals(stack[6].indexOf('{anonymous}()') >= 0, true, 'f2 is anonymous: ' + stack[6]);
      //FIXME: Clean up stack[2], opera has some internal stack weirdness
    }
  });

  test("opera", function() {
    var mode = pst.mode(UnitTest.fn.createGenericError()), e = [];
    e.push({
      message: 'ignored\nignored\nignored\nignored\nLine 40 of linked script http://site.com: in function f1\n      discarded()\nLine 44 of linked script http://site.com\n     f1(1, "abc")\nignored\nignored'
    });
    if (mode == 'opera') {
      function discarded() {
        try {
          this.undef();
        } catch (exception) {
          e.push(exception);
        }
      }
      function f1(arg1, arg2) {
        discarded();
      }
      var f2 = function() {
        f1(1, "abc");
      };
      f2();
    }
    expect(5 * e.length);
    for (var i = 0; i < e.length; i++) {
      var message = pst.opera(e[i]);
      var message_string = message.join("\n");
      equals(message_string.indexOf('ignored'), -1, 'ignored');
      equals(message[0].indexOf('f1()') >= 0, true, 'f1 function name');
      equals(message[0].indexOf('discarded()') >= 0, true, 'f1 statement');
      equals(message[1].indexOf('{anonymous}()@') >= 0, true, 'f2 is anonymous');
      equals(message[1].indexOf('f1(1, "abc")') >= 0, true, 'f2 statement');
    }
  });

  test("other", function() {
    var mode = pst.mode(UnitTest.fn.createGenericError());
    var frame = function(args, fun, caller) {
      this['arguments'] = args;
      this.caller = caller;
      this.fun = fun;
    };
    frame.prototype.toString = function() {
      return 'function ' + this.fun + '() {}';
    };
    function f10() {
    }
    var frame_f2 = new frame([], '', undefined);
    var frame_f1 = new frame([1, 'abc', f10, {
      1: {
        2: {
          3: 4
        }
      }
    }], 'FUNCTION f1  (a,b,c)', frame_f2);
    expect(mode == 'other' ? 4 : 2);
    var message = pst.other(frame_f1);
    var message_string = message.join("\n");
    equals(message[0].indexOf('f1(1,"abc",#function,#object)') >= 0, true, 'f1');
    equals(message[1].indexOf('{anonymous}()') >= 0, true, 'f2 anonymous');
    if (mode == 'other') {
      function f1(arg1, arg2) {
        var message = pst.other(arguments.callee), message_string = message.join("\n");
        //equals(message_string, '', 'debug');
        equals(message[0].indexOf('f1(1,"abc",#function,#object)') >= 0, true, 'f1');
        equals(message[1].indexOf('{anonymous}()') >= 0, true, 'f2 anonymous');
      }
      var f2 = function() {
        f1(1, 'abc', f10, {
          1: {
            2: {
              3: 4
            }
          }
        });
      };
      f2();
    }
  });

  module("util");

  test("stringify", function() {
    expect(5);
    equals(pst.stringifyArguments(["a", 1, {}, function() {
    }, undefined]), '"a",1,#object,#function,undefined');
    equals(pst.stringifyArguments([0, 1, 2, 3]), '0,1,2,3');
    equals(pst.stringifyArguments([['a', null]]), '["a",null]');
    equals(pst.stringifyArguments([[2, 4, 6, 8, 10, 12, 14]]), '[2...14]');
    equals(pst.stringifyArguments([]), '');
  });

  test("isSameDomain", function() {
    expect(1);
    ok(pst.isSameDomain(location.href));
  });

  test("findFunctionName", function() {
    expect(12);
    equals(pst.findFunctionName(['var a = function aa() {', 'var b = 2;', '};'], 2), 'a');
    equals(pst.findFunctionName(['var a = function () {', 'var b = 2;', '};'], 2), 'a');
    equals(pst.findFunctionName(['var a = function() {', 'var b = 2;', '};'], 2), 'a');
	// FIXME: currently failing becuase we don't have a way to distinguish which fn is being sought
    // equals(pst.findFunctionName(['a:function(){},b:function(){', '};'], 1), 'b');
    equals(pst.findFunctionName(['"a": function(){', '};'], 1), 'a');

    equals(pst.findFunctionName(['function a() {', 'var b = 2;', '}'], 2), 'a');
    equals(pst.findFunctionName(['function a(b,c) {', 'var b = 2;', '}'], 2), 'a');
    equals(pst.findFunctionName(['function  a () {', '}'], 2), 'a');
    equals(pst.findFunctionName(['function\ta\t()\t{', '}'], 2), 'a');
    equals(pst.findFunctionName(['  function', '    a', '    ()', '    {', '    }'], 3), 'a');

    equals(pst.findFunctionName(['var data = new Function("return true;");', ''], 1), 'data');
    equals(pst.findFunctionName(['var data = new Function("s,r",', '"return s + r;");'], 1), 'data');

    equals(pst.findFunctionName(['var a = 1;', 'var b = 2;', 'var c = 3;'], 2), '(?)');
  });

  test("getSource cache miss", function() {
    expect(3);
    var p = new printStackTrace.implementation(), file = 'file:///test', lines;
    p.ajax = function(fileArg, callback) {
      equals(fileArg, file, 'cache miss');
      return 'line0\nline1\n';
    };
    lines = p.getSource(file);
    equals(lines[0], 'line0');
    equals(lines[1], 'line1');
  });

  test("getSource cache hit", function() {
    expect(2);
    var p = new printStackTrace.implementation(), file = 'file:///test', lines;
    p.ajax = function(fileArg, callback) {
      ok(false, 'not called');
    };
    p.sourceCache[file] = ['line0', 'line1'];
    lines = p.getSource(file);
    equals(lines[0], 'line0');
    equals(lines[1], 'line1');
  });

  test("sync ajax", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    var data = p.ajax(document.location.href);
    ok(data.indexOf('stacktrace') >= 0, 'synchronous get');
  });

  test("guessAnonymousFunction", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var a = function() {', 'var b = 2;', '};'];
    equals(p.guessAnonymousFunction(file, 2), 'a');
  });

  test("guessAnonymousFunction exception", function() {
    expect(1);
    var p = new printStackTrace.implementation();
    p.getSource = function() {
      throw 'permission denied';
    };
    var file = 'file:///test';
    equals(p.guessAnonymousFunction(file, 2), 'getSource failed with url: file:///test, exception: permission denied');
  });

  test("guessAnonymousFunctions firefox", function() {
    var results = [];
    var p = new printStackTrace.implementation();
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var f2 = function () {', 'var b = 2;', '};', 'function run() {', 'return true;', '}'];
    results.push(['{anonymous}()@' + file + ':74', '{anonymous}()@' + file + ':5', '{anonymous}()@' + file + ':2']);

    (function f2() {
      try {
        this.undef();
      } catch (e) {
        if (p.mode(e) == 'firefox') {
          results.push(p.run());
        }
      }
    })();

    expect(results.length * 1);
    for (var i = 0; i < results.length; ++i) {
      //equals(results[i], '', 'stack trace');
      var functions = p.guessAnonymousFunctions(results[i]);
      //equals(functions.join("\n"), '', 'stack trace after guessing');
      equals(functions[2].substring(0, 4), 'f2()', 'guessed f2 as 3rd result: ' + functions[2]);
      //equals(functions[2].indexOf('f2'), 0, 'guessed f2 as 3rd result');
    }
  });

  test("guessAnonymousFunctions chrome", function() {
    var results = [];
    var p = new printStackTrace.implementation();
    p._mode = 'chrome';
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var f2 = function() {', 'var b = 2;', '};'];
    results.push(['createException() (' + file + ':1:1)', 'run() (' + file + ':1:1)', 'f2() (' + file + ':1:1)']);

    var f2 = function() {
      try {
        this.undef();
      } catch (e) {
        if (p.mode(e) == 'chrome') {
          results.push(p.run());
        }
      }
    };
    f2();

    expect(results.length);
    for (var i = 0; i < results.length; ++i) {
      //equals((results[i]), '', 'debug');
      var functions = p.guessAnonymousFunctions(results[i]);
      //equals(functions.join("\n"), '', 'debug');
      equals(functions[2].indexOf('f2()'), 0, 'guessed f2 in ' + functions[2]);
    }
  });

  test("guessAnonymousFunctions opera", function() {
    var results = [];
    var p = new printStackTrace.implementation();
    p._mode = 'opera';
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var f2 = function() {', 'var b = 2;', '};'];
    results.push(['f2()@' + file + ':2 -- code']);

    var f2 = function() {
      try {
        this.undef();
      } catch (e) {
        if (p.mode(e) == 'opera') {
          results.push(p.run());
        }
      }
    };
    f2();

    expect(results.length * 1);
    for (var i = 0; i < results.length; ++i) {
      var functions = p.guessAnonymousFunctions(results[i]);
      // equals(functions, '', 'debug');
      equals(functions[0].indexOf('f2'), 0, 'f2');
    }
  });

  test("guessAnonymousFunctions opera10", function() {
    // TODO currently failing in Opera 10.60
    var results = [];
    var p = new printStackTrace.implementation();
    p._mode = 'opera10';
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var f2 = function() {', 'var b = 2;', '};'];
    results.push(["{anonymous}()@" + file + ":1:1", "{anonymous}()@" + file + ":1:1"]);

    var f2 = function() {
      try {
        this.undef();
      } catch (e) {
        if (p.mode(e) == 'opera10') {
          //alert("e.message: " + e.message);
          results.push(p.run());
        }
      }
    };
    f2();

    expect(results.length * 1);
    for (var i = 0; i < results.length; ++i) {
      //equals((results[i]), '', 'debug');
      var functions = p.guessAnonymousFunctions(results[i]);
      //equals(functions.join("\n"), '', 'debug');
      equals(functions[1].indexOf('f2()'), 0, 'guessed f2 in ' + functions[1]);
    }
  });

  test("guessAnonymousFunctions other", function() {
    var results = [];
    var p = new printStackTrace.implementation(), mode = p.mode(UnitTest.fn.createGenericError());
    p._mode = 'other';
    var file = 'http://' + window.location.hostname + '/file.js';
    p.sourceCache[file] = ['var f2 = function() {', 'var b = 2;', '};'];
    results.push(['{anonymous}()']);

    if (mode == 'other') {
      var f2 = function() {
        try {
          this.undef();
        } catch (e) {
          results.push(p.run());
        }
      };
      f2();
    }

    expect(1 * results.length);
    for (var i = 0; i < results.length; ++i) {
      //equals((results[i]), '', 'debug');
      equals(p.guessAnonymousFunctions(results[i])[0].indexOf('{anonymous}'), 0, 'no file and line number in "other" mode');
    }
  });
})(window, document);
