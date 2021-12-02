var KDMonitor = (function () {

    var KDMonitor = /** @class */ (function () {
        function KDMonitor(options) {
            this.options = options;
        }
        KDMonitor.init = function (options) {
            console.log("KDMonitor init options is ", options);
            if (KDMonitor.isInit) {
                console.error("只能初始化一次!");
                return;
            }
            KDMonitor.isInit = true;
            new KDMonitor(options);
        };
        KDMonitor.isInit = false;
        return KDMonitor;
    }());

    return KDMonitor;

})();
//# sourceMappingURL=bundle.js.map
