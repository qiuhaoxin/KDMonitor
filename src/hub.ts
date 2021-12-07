



import {Hub as HubInterface,Client,Options,EventProcessor} from './types/index';
import {getGlobalObject, KDMonitorGlobal} from './utils/global';
export class Hub implements HubInterface{

    private _client:Client<Options>;
    public constructor(client?:Client){
       
        if(client){
            this.bindClient(client);
        }
    }
    bindClient(client?: any): void {
        this._client=client;
        if(client && client.setupIntegrations){
            client.setupIntegrations();
        }
    }
    getClient():Client {
        return this._client;
    }
    captureEvent(): void {
        throw new Error('Method not implemented.');
    }
    captureException(): void {
        throw new Error('Method not implemented.');
    }

}

export function getCurrentHub():HubInterface{
    const carrier=getGlobalObject() as KDMonitorGlobal;
    if(carrier.__KDMonitor__ && carrier.__KDMonitor__.hub){
        return carrier.__KDMonitor__.hub;
    }else {
        const hub=new Hub();
        carrier.__KDMonitor__=carrier.__KDMonitor__ || {};
        carrier.__KDMonitor__.hub=hub;
    }
    return carrier.__KDMonitor__.hub;
}

export function getGlobalEventProcessor():EventProcessor[]{
    const carrier=getGlobalObject() as KDMonitorGlobal;
    carrier.__KDMonitor__.eventProcessors=carrier.__KDMonitor__.eventProcessors || [];
    return carrier.__KDMonitor__.eventProcessors;
}

export function addGlobalEventProcessor(callback:EventProcessor):void{
    getGlobalEventProcessor().push(callback);
}