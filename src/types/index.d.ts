import BaseClient from "../client/BaseClient"

export interface Transport{

}

export interface TransportOptions{

}

export interface Hub{
    bindClient(client?:Client):void;
    getClient():Client;
    captureEvent():void;
    captureException():void;


}


export interface Integration {
    name:string;
    setupOnce(addGlobalEventProcessor:(callback:EventProcessor)=>void,getCurrentHub:()=>Hub):void
}

export interface IntegrationClass<T>{
    id:string;
    new (...arg:any):T;
}

export interface GlobalHandlerOptions{
    onerror:boolean;
    onunhandledrejection:boolean;
}




export interface Carrier{
    __KDMonitor__?:{
        hub?:Hub,
        integrations:Integration[]
    }
}

// SDK 配置项
export interface Options{
    url:string | Function,//要发送事件的地址
    enabled?:boolean; //是否允许KDMonitor上报事件
    defaultIntegrations:Integration[];
    integrations:Integration[] | Function;
}

export interface Client<O extends Options=Options>{
    getIntegrations<T extends Integration>(integration : IntegrationClass<T>):T | null;
    setupIntegrations():void;
}


export interface Backend{
    sendEvent(event:Event):void;
    getTransport():Transport
}

export type BackendClass<T extends Backend,O extends Options>=new (O) => T;


export interface Event{
    message:string,

}
export type EventProcessor=(event:Event)=>PromiseLike<Event | null> | Event | null;

export interface WrappedFunction extends Function{
    [key:string]:any;
    __KDMonitor__?:boolean;
    __KDMonitor_original__?:WrappedFunction;
    __KDMonitor_wrapped__?:WrappedFunction;
}