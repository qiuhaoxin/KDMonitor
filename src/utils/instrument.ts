
export interface InstrumentHandler{
    type:InstrumentHandlerType,
    callback:InstrumentCallback
}

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
        return false;
    }
}
let _originUnHandledRejection=null;
function instrumentUnHandledRejection():void{
    _originUnHandledRejection=window.onunhandledrejection;

    window.onunhandledrejection=function(e:any):boolean{

    }
}