var KDMonitor = (function (exports) {

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArray(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
            if (ar || !(i in from)) {
                if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                ar[i] = from[i];
            }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
    }

    function isNodeEnv() {
        var result = Object.prototype.toString.call(typeof process != 'undefined' ? process : 0) === '[object process]';
        return result;
    }

    function getGlobalObject() {
        return (isNodeEnv()
            ? global
            : typeof window !== 'undefined'
                ? window
                : typeof self !== 'undefined'
                    ? self
                    : {});
    }

    var Hub = /** @class */ (function () {
        function Hub(client) {
            if (client) {
                this.bindClient(client);
            }
        }
        Hub.prototype.bindClient = function (client) {
            this._client = client;
            if (client && client.setupIntegrations) {
                client.setupIntegrations();
            }
        };
        Hub.prototype.getClient = function () {
            return this._client;
        };
        Hub.prototype.captureEvent = function () {
            throw new Error('Method not implemented.');
        };
        Hub.prototype.captureException = function () {
            throw new Error('Method not implemented.');
        };
        return Hub;
    }());
    function getCurrentHub() {
        var carrier = getGlobalObject();
        if (carrier.__KDMonitor__ && carrier.__KDMonitor__.hub) {
            return carrier.__KDMonitor__.hub;
        }
        else {
            var hub = new Hub();
            carrier.__KDMonitor__ = carrier.__KDMonitor__ || {};
            carrier.__KDMonitor__.hub = hub;
        }
        return carrier.__KDMonitor__.hub;
    }
    function getGlobalEventProcessor() {
        var carrier = getGlobalObject();
        carrier.__KDMonitor__.eventProcessors = carrier.__KDMonitor__.eventProcessors || [];
        return carrier.__KDMonitor__.eventProcessors;
    }
    function addGlobalEventProcessor(callback) {
        getGlobalEventProcessor().push(callback);
    }

    var installedIntegrations = [];
    function setUpIntegrations(options) {
        var integrationIdx = {};
        var integrations = getIntegrationsToSetup(options);
        integrations.forEach(function (integration) {
            integrationIdx[integration.name] = integration;
            setUpIntegration(integration);
        });
        return integrationIdx;
    }
    function setUpIntegration(integration) {
        if (installedIntegrations.indexOf(integration.name) !== -1)
            return;
        integration.setupOnce(addGlobalEventProcessor, getCurrentHub);
        installedIntegrations.push(integration.name);
    }
    function getIntegrationsToSetup(options) {
        var defaultIntegrations = options.defaultIntegrations || [];
        var userIntegrations = options.integrations || [];
        var integrations = __spreadArray([], filterDuplicate(defaultIntegrations), true);
        if (Array.isArray(userIntegrations)) {
            integrations = __spreadArray(__spreadArray([], integrations.filter(function (i) {
                return userIntegrations.every(function (userI) { return userI.name !== i.name; });
            }), true), filterDuplicate(userIntegrations), true);
        }
        else if (typeof userIntegrations == 'function') {
            integrations = userIntegrations(integrations);
            integrations = Array.isArray(integrations) ? integrations : [integrations];
        }
        return integrations;
    }
    function filterDuplicate(integrations) {
        return integrations.reduce(function (acc, integration) {
            if (acc.every(function (accIntegration) { return accIntegration.name !== integration.name; })) {
                acc.push(integration);
            }
            return acc;
        }, []);
    }

    var BaseClient = /** @class */ (function () {
        function BaseClient(backend, options) {
            this._integrations = {};
            this._backend = new backend(options);
            this._options = options;
        }
        BaseClient.prototype.getIntegrations = function (integration) {
            return null;
        };
        //初始化integrations
        BaseClient.prototype.setupIntegrations = function () {
            this._integrations = setUpIntegrations(this._options);
        };
        return BaseClient;
    }());

    var Backend = /** @class */ (function () {
        function Backend() {
        }
        Backend.prototype.sendEvent = function (event) {
            throw new Error('Method not implemented.');
        };
        Backend.prototype.getTransport = function () {
            throw new Error('Method not implemented.');
        };
        return Backend;
    }());

    var BrowserBackend = /** @class */ (function (_super) {
        __extends(BrowserBackend, _super);
        function BrowserBackend() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BrowserBackend.prototype.sendEvent = function (event) {
        };
        BrowserBackend.prototype.getTransport = function () {
        };
        return BrowserBackend;
    }(Backend));

    var BrowserClient = /** @class */ (function (_super) {
        __extends(BrowserClient, _super);
        function BrowserClient(options) {
            return _super.call(this, BrowserBackend, options) || this;
        }
        return BrowserClient;
    }(BaseClient));

    var handlers = {};
    var instrumented = {};
    function addInstrumentHandler(handler) {
        var type = handler.type, callback = handler.callback;
        handlers[type] = handlers[type] || [];
        handlers[type].push(callback);
        instrumentType(type);
    }
    function instrumentType(type) {
        if (instrumented[type])
            return;
        instrumented[type] = true;
        switch (type) {
            case 'error':
                instrumentError();
                break;
            case 'unhandledrejection':
                instrumentUnHandledRejection();
                break;
        }
    }
    function triggerHandlers(type, data) {
        if (!type || !handlers[type])
            return;
        for (var _i = 0, _a = handlers[type] || []; _i < _a.length; _i++) {
            var handler = _a[_i];
            try {
                handler && handler(data);
            }
            catch (ex) {
            }
        }
    }
    var _originOnError = null;
    function instrumentError() {
        _originOnError = window.onerror;
        window.onerror = function (msg, url, row, line, error) {
            triggerHandlers('error', {
                msg: msg,
                url: url,
                row: row,
                line: line,
                error: error
            });
            if (_originOnError) {
                return _originOnError.apply(this, arguments);
            }
            return true; //返回true，报错消息不显示在控制台，否则显示
        };
    }
    function instrumentUnHandledRejection() {
        window.onunhandledrejection = function (e) {
            triggerHandlers('unhandledrejection', {
                data: e
            });
            return false;
        };
    }
    function fill(source, method, replacementFactory) {
        if (!source[method])
            return;
        var originMethod = source[method];
        var wrapped = replacementFactory(originMethod);
        if (typeof wrapped == 'function') {
            try {
                wrapped.prototype = wrapped.prototype || {};
                Object.defineProperties(wrapped, {
                    __KDMonitor_original__: {
                        enumerable: false,
                        value: originMethod,
                    }
                });
            }
            catch (ex) {
            }
        }
        source[method] = wrapped;
    }
    function wrap(fn, options, before) {
        if (options === void 0) { options = {}; }
        if (typeof fn != 'function') {
            return fn;
        }
        try {
            if (fn.__KDMonitor__) {
                return fn;
            }
            if (fn.__KDMonitor_wrapped__) {
                return fn.__KDMonitor_wrapped__;
            }
        }
        catch (e) {
            return fn;
        }
        var kdMonitorWrapped = function () {
            var args = Array.prototype.slice.call(arguments);
            try {
                var wrappedArguments = args.map(function (arg) { return wrap(arg, options); });
                return fn.apply(this, wrappedArguments);
            }
            catch (e) {
                console.log("捕获异常!");
            }
        };
        return kdMonitorWrapped;
    }

    var GlobalHandler = /** @class */ (function () {
        function GlobalHandler(options) {
            this.name = GlobalHandler.id;
            this._isOnErrorHandlerInstalled = false;
            this._isOnUnHandledRejectionInstalled = false;
            this._options = __assign({ onerror: true, onunhandledrejection: true }, options);
        }
        GlobalHandler.prototype.setupOnce = function () {
            if (this._options.onerror) {
                this._initOnErrorHandler();
            }
            if (this._options.onunhandledrejection) {
                this._initOnUnHandledRejection();
            }
        };
        GlobalHandler.prototype._initOnErrorHandler = function () {
            if (this._isOnErrorHandlerInstalled)
                return;
            addInstrumentHandler({
                callback: function (data) {
                    console.log("error is ", data);
                },
                type: 'error',
            });
            this._isOnErrorHandlerInstalled = true;
        };
        GlobalHandler.prototype._initOnUnHandledRejection = function () {
            if (this._isOnUnHandledRejectionInstalled)
                return;
            this._isOnUnHandledRejectionInstalled = true;
            addInstrumentHandler({
                callback: function (data) {
                    console.log("unhandledrejection is ", data);
                },
                type: 'unhandledrejection',
            });
        };
        GlobalHandler.id = "global_handler";
        return GlobalHandler;
    }());

    var TryCatch = /** @class */ (function () {
        function TryCatch(options) {
            this.name = TryCatch.id;
            this._options = __assign({ setTimeout: true, setInterval: true, requestAnimationFrame: true, XMLHttpRequest: true, eventTarget: true }, options);
        }
        TryCatch.prototype.setupOnce = function () {
            var global = getGlobalObject();
            if (this._options.setTimeout) {
                fill(global, 'setTimeout', this._wrappedTimeout.bind(this));
            }
            if (this._options.setInterval) ;
            if (this._options.XMLHttpRequest) ;
            if (this._options.requestAnimationFrame) ;
            if (this._options.eventTarget) ;
        };
        TryCatch.prototype._wrappedTimeout = function (origin) {
            return function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                var originalCallback = args[0];
                args[0] = wrap(originalCallback, {});
                return origin.apply(this, args);
            };
        };
        TryCatch.id = "type_catch";
        return TryCatch;
    }());

    var defaultIntegrations = [
        new GlobalHandler(),
        new TryCatch()
    ];
    var DEFAULT_OPTIONS = {
        url: '',
        enabled: true,
        frameWork: '',
        defaultIntegrations: defaultIntegrations
    };
    function init(options) {
        console.log("KDMonitor init!!!");
        var _options = __assign(__assign({}, DEFAULT_OPTIONS), options);
        var hub = getCurrentHub();
        hub.bindClient(new BrowserClient(_options));
    }
    function captureError() {
    }
    function captureMessage(message) {
    }

    exports.captureError = captureError;
    exports.captureMessage = captureMessage;
    exports.init = init;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=bundle.js.map
