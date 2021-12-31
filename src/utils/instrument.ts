
export interface InstrumentHandler{
    type:InstrumentHandlerType,
    callback:InstrumentCallback
}

import { argv } from 'process';
import {WrappedFunction} from '../types/index';
import { getGlobalObject } from './global';
import {supportFetch,isInstanceOf} from './support';

type InstrumentCallback=(data:any)=>void;
type InstrumentHandlerType='error' | 'unhandledrejection' | 'dom' | 'console' | 'xhr' | 'fetch';


type AddEventListener=(
    type:string,
    listener:EventListenerOrEventListenerObject,
    options?:AddEventListenerOptions
)=>void;

type RemoveEventListener=(
    type:string,
    listener:EventListenerOrEventListenerObject,
    options?:AddEventListenerOptions
)=>void;

type InstrumentedElement=Element & {
    __KDMonitor_instrumentation_handlers__:{
        [key in 'click' | 'keypress']:{
            handler?:Function,
            refCount:number,
        }
    }
}

const handlers:{[key in InstrumentHandlerType]?:InstrumentCallback[]}={};
const instrumented:{[key in InstrumentHandlerType]? : boolean}={};

const global=getGlobalObject<Window>();

export function addInstrumentHandler(handler:InstrumentHandler){
    const {type,callback}=handler;
    handlers[type]=handlers[type] || [];
    (handlers[type] as InstrumentCallback[]).push(callback);
    instrumentType(type);
}

function instrumentType(type:InstrumentHandlerType):void{
    if(instrumented[type])return;
    instrumented[type]=true;
    console.log("type is ",type);
    switch(type){
        case 'error':
            instrumentError();
        break;
        case 'unhandledrejection':
            instrumentUnHandledRejection();
        break;
        case 'console':
            instrumentConsole();
        break;
        case 'xhr':
            instrumentXHR();
        break;
        case 'dom':
            instrumentDom();
        break;
        case 'fetch':
            instrumentFetch();
        break;
    }
}
function getUrlFromFetch(...args:any[]=[]):string{
    if(typeof args[0]==='string'){
        return args[0];
    }
    if('Request' in global && isInstanceOf(args[0],Request)){
        return args[0].url;
    }
    return '';
}
function getMethodFromFetch(...args:any[]=[]):string{
    if('Request' in global && isInstanceOf(args[0],Request) && args[0].method){
        return String(args[0].method).toUpperCase();
    }
    if(args[1] && args[1].method){
        return String(args[1].method).toUpperCase();
    }
    return 'GET';
}
function instrumentXHR(){
    if(!supportFetch())return false;

    fill(global,'fetch',function(originCall:()=>void):()=>void{
        return function(
            ...args:any[]
        ):void{
            const handleData={
                args,
                fetchData:{
                    url:getUrlFromFetch(args),
                    method:getMethodFromFetch(args)
                },
                startTimestamp:Date.now(),
            }
            triggerHandlers('fetch',
                handleData
            )
            return originCall.apply(global,args)
            .then((response:Response)=>{
                triggerHandlers(
                    'fetch',
                    {
                        ...handleData,
                        endTimestamp:Date.now(),
                        response,
                    }
                )
                return response;
            })
            .catch((error:Error)=>{
                triggerHandlers(
                    'fetch',
                    {
                        ...handleData,
                        endTimeStamp:Date.now(),
                        error,
                    }
                   
                )
                throw error;
            })
        }
    })
}

function instrumentFetch(){

}

function instrumentDom():void{
    if(!('document' in global)){
        return;
    }

    const triggerDomHandler=triggerHandlers.bind(null,'dom');
    const globalDOMListener=makeDOMHandler(triggerDomHandler,true);
    //添加document的click 和 keypress的事件监听，事件冒泡到document时可以捕获
    global.document.addEventListener('click',globalDOMListener,false);
    global.document.addEventListener('keypress',globalDOMListener,false);

    //但还是要在用户设置的listener中购入捕获机制，因为可以设置buddle为false或preventDefault()来取消冒泡
    ['EventTarget','Node'].forEach((target:string)=>{
        const proto=(global as any)[target] && (global as any)[target].prototype;
        if(!proto || !proto.hasOwnProperty || !proto.hasOwnProperty('addEventListener')){
            return;
        }
        fill(proto,'addEventListener',function(origin:AddEventListener):AddEventListener{
            return function(
                this:Element,
                type:string,
                listener:EventListenerOrEventListenerObject,
                options?: boolean | AddEventListenerOptions
            ):AddEventListener{
                console.log("fill dom !!",type);
                if(type==='click' || type==='keypress'){
                    try{
                        const el=this as InstrumentedElement;
                        const handlers=(el.__KDMonitor_instrumentation_handlers__=el.__KDMonitor_instrumentation_handlers__||{});
                        const handlerForType=(handlers[type]=handlers[type] || {refCount:0});

                        if(!handlerForType.handler){
                            console.log("handleForType handler ");
                            const handler=makeDOMHandler(triggerHandlers,false);
                            console.log("handler is ",handler);
                            handlerForType.handler=handler;
                            origin.call(this,type,handler,options);
                        }
                        handlerForType.refCount+=1;

                    }catch(e){

                    }
                }
                return origin.call(this,type,listener,options);
            }
        });

        fill(proto,'removeEventListener',function(originalRemoveEventListener:RemoveEventListener):RemoveEventListener{
            return function(
                this:Element,
                type:string,
                listener:EventListenerOrEventListenerObject,
                options?:boolean | EventListenerOptions
            ):RemoveEventListener{
                if(type=='click' || type=='keypress'){
                    try{
                        const el=this as InstrumentedElement;
                        const handlers=el.__KDMonitor_instrumentation_handlers__ || {};
                        const handlerForType=handlers[type];
                        if(handlerForType){
                            handlerForType.refCount-=1;
                            if(handlerForType.refCount <=0){
                                originalRemoveEventListener.call(this,type,listener,options);
                                handlerForType.handler=undefined;
                                delete handlers[type];
                            }
                            if(Object.keys(handlers).length===0){
                                delete el.__KDMonitor_instrumentation_handlers__;
                            }
                        }
                    }catch(ex){
    
                    }
                }
                return originalRemoveEventListener.call(this,type,listener,options);
            }
        })
    })


}
const debounceDuration = 1000;
let debounceTimerID: number | undefined;
let lastCapturedEvent: Event | undefined;
function makeDOMHandler(handler:Function,globalListener:boolean=false):(event:Event)=>void{
    return function(event:Event):void{
        if(!event || event==lastCapturedEvent){
            return;
        }
        if(shouldSkipDomEvent(event)){
            return;
        }
        const name=event.type=='keypress' ? 'input' : event.type;

        if(debounceTimerID===undefined){
            handler({
                event:event,
                name,
                global:globalListener,
            })
            lastCapturedEvent=event;
        }else if(shouldShortcircuitPreviousDebounce(lastCapturedEvent,event)){
            handler({
                event:event,
                name,
                global:globalListener,
            })
            lastCapturedEvent=event;
        }
        clearTimeout(debounceTimerID);
        debounceTimerID=global.setTimeout(() => {
            debounceTimerID=undefined;
        }, debounceDuration);

    }
}

function shouldShortcircuitPreviousDebounce(previous:Event|undefined,current:Event):boolean{
    if(!previous){
        return true;
    }
    if(previous.type!=current.type){
        return true;
    }
    try{
        if(previous.target!=current.target){
            return true;
        }
    }catch(ex){

    }
    return false;
}

function shouldSkipDomEvent(event:Event):boolean{
    if(event.type!=='keypress'){
        return false;
    }
    try{
        const target=event.target as HTMLElement;
        if(!target || !target.tagName){
            return true;
        }
        if(target.tagName=='INPUT' || target.tagName=='TEXTAREA' || target.isContentEditable){
            return false;
        }
    }catch(ex){

    }
    return true;
}

function instrumentConsole(){
    const global=getGlobalObject() as {[key:string]:any};
    if(!('console' in global)){
        return ;
    }
    ['info','error','assert','warn','debug'].forEach((consoleType:string)=>{
        fill(global.console,consoleType,function(originalCallback:()=>any):Function{
            return function(
                ...args:any[]
            ){
                triggerHandlers('console',{args,level:consoleType})
                if(originalCallback){
                    Function.prototype.apply.call(originalCallback,global.console,args);
                }
            }
        })
    })
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
            console.log("arg is ",args);
            const wrappedArguments=args.map((arg:any)=>wrap(arg,options));
            console.log("wrappedArguments is ",wrappedArguments);
            return fn.apply(this,wrappedArguments);
        }catch(e){
            console.log("捕获异常!",e);
        }
    }
    try{
        for(let prop in fn){
            if(Object.prototype.hasOwnProperty.call(fn,prop)){
                kdMonitorWrapped[prop]=fn[prop];
            }
        }
    }catch(_o){

    }
    fn.prototype=fn.prototype||{};
    kdMonitorWrapped.prototype=fn.prototype;

    Object.defineProperty(fn,'__KDMonitor_wrapped__',{
        value:kdMonitorWrapped,
        enumerable:false,  
    })
    Object.defineProperties(kdMonitorWrapped,{
        __KDMonitor__:{
            value:true,
            enumerable:false,
        },
        __KDMonitor_original__:{
            value:fn,
            enumerable:false,
        }
    })

    try{
        const nameDecorator=Object.getOwnPropertyDescriptor(kdMonitorWrapped,'name') as PropertyDescriptor;
        if(nameDecorator.configurable){ //configurable  PropertyDescriptor
            Object.defineProperty(
                kdMonitorWrapped,
                'name',
                {
                    get(){
                        return fn.name;
                    }
                }
            )
        }

    }catch(_O){}
    return kdMonitorWrapped;

}