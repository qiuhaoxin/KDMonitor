
export interface InstrumentHandler{
    type:InstrumentHandlerType,
    callback:InstrumentCallback
}

import {WrappedFunction} from '../types/index';

type InstrumentCallback=(data:any)=>void;
type InstrumentHandlerType='error' | 'unhandledrejection' | 'dom' | 'console';

const handlers:{[key in InstrumentHandlerType]?:InstrumentCallback[]}={};
const instrumented:{[key in InstrumentHandlerType]? : boolean}={};

export function addInstrumentHandler(handler:InstrumentHandler){
    const {type,callback}=handler;
    handlers[type]=handlers[type] || [];
    (handlers[type] as InstrumentCallback[]).push(callback);
    instrumentType(type);
}

function instrumentType(type:InstrumentHandlerType):void{
    if(instrumented[type])return;
    instrumented[type]=true;
    switch(type){
        case 'error':
            instrumentError();
        break;
        case 'unhandledrejection':
            instrumentUnHandledRejection();
        break;
    }
}


function triggerHandlers(type:InstrumentHandlerType,data:any):void{
    if(!type || !handlers[type])return;
    for(const handler of handlers[type] || []){
        try{
            handler && handler(data);
        }catch(ex){

        }
    }
}
let _originOnError:OnErrorEventHandler=null;
function instrumentError():void{
    _originOnError=window.onerror;
    window.onerror=function(msg:any,url:any,row:any,line:any,error:any):boolean{
        triggerHandlers(
            'error',
            {
                msg,
                url,
                row,
                line,
                error
            }
        );
        if(_originOnError){
           return _originOnError.apply(this,arguments);
        }
        return true; //返回true，报错消息不显示在控制台，否则显示
    }
}
let _originUnHandledRejection=null;
function instrumentUnHandledRejection():void{
    _originUnHandledRejection=window.onunhandledrejection;

    window.onunhandledrejection=function(e:any):boolean{
        triggerHandlers(
            'unhandledrejection',
            {
                data:e
            }
        )

        return false;
    }
}


export function fill(source:{[key:string]:any},method:string,replacementFactory:(...arg:any[])=>any):void{
    if(!source[method])return;
    const originMethod=source[method] as ()=>any;

    const wrapped=replacementFactory(originMethod) as WrappedFunction;

    if(typeof wrapped=='function'){
        try{
            wrapped.prototype=wrapped.prototype || {};
            Object.defineProperties(wrapped,{
                __KDMonitor_original__:{
                    enumerable:false,
                    value:originMethod,
                }
            })
        }catch(ex){

        }
    }

    source[method]=wrapped;
}

export function wrap(
    fn:WrappedFunction,
    options:{
        
    }={},
    before?:WrappedFunction):any{
    if(typeof fn!='function'){
        return fn;
    }
    try{
        if(fn.__KDMonitor__){
            return fn;
        }
        if(fn.__KDMonitor_wrapped__){
            return fn.__KDMonitor_wrapped__;
        }
    }catch(e){
        return fn;
    }
    const kdMonitorWrapped:WrappedFunction=function(this:any):void{
        const args=Array.prototype.slice.call(arguments);
        try{
            const wrappedArguments=args.map((arg:any)=>wrap(arg,options));
            return fn.apply(this,wrappedArguments);
        }catch(e){
            console.log("捕获异常!");
        }
    }
    return kdMonitorWrapped;

}