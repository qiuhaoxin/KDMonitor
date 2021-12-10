
import {Options as KDMonitorOption} from './types/index';
import BrowserClient from './client/BrowserClient';
import GlobalHandler from './integrations/globalHandler';
import TryCatch from './integrations/trycatch';
import TimeLine from './integrations/timeline';
const defaultIntegrations=[
    new GlobalHandler(),
    new TryCatch(),
    new TimeLine(),
]
const DEFAULT_OPTIONS:{
    [index : string]:any,
}={
    url:'',//要上报的地址
    enabled:true,
    frameWork:'',//支持的框架
    defaultIntegrations
    
}
import {getCurrentHub} from './hub'
import {Hub} from './types/index'
export function init(options:KDMonitorOption){
    console.log("KDMonitor init!!!");
    const _options:KDMonitorOption={
        ...DEFAULT_OPTIONS,
        ...options,
    }
    const hub=getCurrentHub();
    hub.bindClient(new BrowserClient(_options))
}

function callOnHub(method:string){
    const hub:Hub=getCurrentHub();
}
export function captureError():void{

}

export function captureMessage(message:string):void{

}