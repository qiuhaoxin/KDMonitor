


import {setUpIntegrations,IntegrationIdx} from '../integrations/integration'
import {Client,Options,Backend,IntegrationClass,Integration,BackendClass} from '../types/index';
export default class BaseClient<B extends Backend,O extends Options> implements Client<Options>{

    protected _backend:Backend;
    protected _options:Options;
    protected _integrations:IntegrationIdx={};
    constructor(backend:BackendClass<B,O>,options:Options){
        this._backend=new backend(options);
        this._options=options;
    }
    getIntegrations<T extends Integration>(integration:IntegrationClass<T>):T | null{

        return null;
    }
    //初始化integrations
    setupIntegrations(){
        this._integrations=setUpIntegrations(this._options);
        
    }
}