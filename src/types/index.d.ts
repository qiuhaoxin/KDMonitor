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

export interface GlobalHandlerOptions{
    onerror:boolean;
    onunhandledrejection:boolean;
}