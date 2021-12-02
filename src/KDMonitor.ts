interface KDMonitorOption{

}

const DEFAULT_OPTIONS:{
    [index : string]:any,
}={
    server_url:'',//要上报的地址
    frameWork:'',//支持的框架

}

class KDMonitor{
    private options:KDMonitorOption;
    constructor(options:KDMonitorOption){
        this.options=options;
    }
    private static isInit=false;
    public static init(options:KDMonitorOption){
        console.log("KDMonitor init options is ",options);
        if(KDMonitor.isInit){
            console.error("只能初始化一次!");
            return;
        }
        KDMonitor.isInit=true;
        const kdMonitor:KDMonitor=new KDMonitor(options);
        
    }
}

export default KDMonitor;