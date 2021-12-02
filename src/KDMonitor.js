"use strict";
const DEFAULT_OPTIONS = {
    server_url: '',
    frameWork: '',
};
class KDMonitor {
    constructor(options) {
        this.options = options;
    }
    static init(options) {
        if (KDMonitor.isInit) {
            console.error("只能初始化一次!");
            return;
        }
        const kdMonitor = new KDMonitor(options);
    }
}
KDMonitor.isInit = false;
