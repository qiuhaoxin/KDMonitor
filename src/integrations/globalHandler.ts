

import {Integration,GlobalHandlerOptions} from '../types/index';
import {addInstrumentHandler} from '../utils/instrument'
export default class GlobalHandler implements Integration{
    public static id:string="global_handler";
    private readonly _options:GlobalHandlerOptions;
    name:string=GlobalHandler.id;
    private _isOnErrorHandlerInstalled:boolean=false;
    private _isOnUnHandledRejectionInstalled:boolean=false;

    public constructor(options?:GlobalHandlerOptions){
        this._options={
            onerror:true,
            onunhandledrejection:true,
            ...options,
        }
    }
    public setupOnce():void{
        if(this._options.onerror){
            this._initOnErrorHandler();
        }
        if(this._options.onunhandledrejection){
            this._initOnUnHandledRejection();
        }
    }
    private _initOnErrorHandler():void{
        if(this._isOnErrorHandlerInstalled)return;
        addInstrumentHandler({
            callback:function(data:any){
                console.log("error is ",data);
            },
            type:'error',
        })
        this._isOnErrorHandlerInstalled=true;

    }
    private _initOnUnHandledRejection():void{
        if(this._isOnUnHandledRejectionInstalled)return;
        this._isOnUnHandledRejectionInstalled=true;
        addInstrumentHandler({
            callback:function(data:any){
                console.log("unhandledrejection is ",data)
            },
            type:'unhandledrejection',
        })
    }
}