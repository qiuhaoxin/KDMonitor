

import {EventProcessor, Hub, Integration, WrappedFunction} from '../types/index'
import { getGlobalObject } from '../utils/global';
import {fill,wrap} from '../utils/instrument';

const DEFAULT_EVENT_TARGET=[
    'EventTarget',
    'Window',
    'Node',
    'FileReader',
    'Notification',
]


type XMLHttpRequestProp= 'onload' | 'onerror' | 'onreadystatechange' | 'onprogress';
interface TryCatchOptions{
    setTimeout?:boolean;
    setInterval?:boolean;
    requestAnimationFrame?:boolean;
    XMLHttpRequest?:boolean;
    eventTarget?:boolean;
}
export default class TryCatch implements Integration{
    private static id="type_catch";
    name: string=TryCatch.id;
    private readonly _options:TryCatchOptions;
    constructor(options?:Partial<TryCatchOptions>){
        this._options={
            setTimeout:true,
            setInterval:true,
            requestAnimationFrame:true,
            XMLHttpRequest:true,
            eventTarget:true,
            ...options,
        }

    }
    public setupOnce(): void {
        const global=getGlobalObject() as {[key:string]:any};
        if(this._options.setTimeout){
            fill(global,'setTimeout',this._wrappedTimeout.bind(this));
        }
        if(this._options.setInterval){
            fill(global,'setInterval',this._wrappedTimeout.bind(this));
        }
        if(this._options.XMLHttpRequest && 'XMLHttpRequest' in global){
            console.log("test !!!");
            fill(XMLHttpRequest.prototype,'send',this._wrappedXHR.bind(this))
        }
        if(this._options.requestAnimationFrame){
            fill(global,'requestAnimationFrame',this._wrapRAF.bind(this));
        }
        if(this._options.eventTarget){
            const eventTargets=Array.isArray(this._options.eventTarget) ? this._options.eventTarget : DEFAULT_EVENT_TARGET;
            eventTargets.forEach(this._wrappedEventTarget.bind(this))
        }
    }
    private _wrappedEventTarget(eventTarget:string){
        const global=getGlobalObject() as {[key:string]:any};
        const proto=global[eventTarget] && global[eventTarget].prototype;
        if(!proto && !proto.hasOwnProperty && !proto.hasOwnProperty('addEventListener')){
            return;
        }
        fill(proto,'addEventListener',function(
            original:()=>void
        ):(eventName:string,fn:EventListenerObject,options?:boolean | AddEventListenerOptions)=>void{
            return function(this:any,
                eventName:string,
                fn:EventListenerObject,
                options?:boolean | AddEventListenerOptions):(eventName:string,
                    fn:EventListenerObject,capture?:boolean,secure?:boolean)=>void{
                    try{
                        if(fn.handleEvent && typeof fn.handleEvent=='function'){
                            fn.handleEvent=wrap(
                                fn.handleEvent,
                                {

                                }
                            );
                        }
                    } catch(ex){

                    }
                    return original.call(
                        this,
                        eventName,
                        wrap(
                            (fn as any) as WrappedFunction,
                            {

                            }
                        ),
                        options,
                    )

                }
        })
        fill(proto,'removeEventListener',function(
            originalCallback:()=>void
        ):(this:any,eventName:string,fn:EventListenerObject,options?:boolean | EventListenerOptions)=>()=>void{
            return function(
                this:any,
                eventName:string,
                fn:EventListenerObject,
                options?:boolean | EventListenerOptions):()=>void{
                const wrappedEventHandler=(fn as unknown) as WrappedFunction;
                try{
                    const originalEventHandler=wrappedEventHandler?.__KDMonitor_wrapped__;
                    if(originalEventHandler){
                        originalCallback.call(this,eventName,originalEventHandler,options);
                    }
                }catch(e){

                }
                return originalCallback.call(this,eventName,wrappedEventHandler,options);
            }
        })
    }
    private _wrappedXHR(originSend:()=>any):()=>void{
        console.log("wrappedXHR !!");
        return function(this:XMLHttpRequest,...args:any[]):void{
            console.log("this xhr is ",this);
            const xhr=this;
            const xhrProps : XMLHttpRequestProp[]=['onload','onerror','onprogress','onreadystatechange'];
            xhrProps.forEach((xhrProp:XMLHttpRequestProp)=>{
                console.log("xhrProp is ",xhrProp);
                fill(xhr,xhrProp,function(origin:()=>any){

                    const wrapOptions={

                    }

                    return wrap(origin,wrapOptions)
                })
            })
            return originSend.apply(this,args);
        }
    }
    private _wrappedTimeout(origin:()=>any):()=>number{
        return function(this:any,...args:any[]){
            const originalCallback=args[0];
            args[0]=wrap(
                originalCallback,
                {},
            )
            return origin.apply(this,args); 
        }
    }
    private _wrapRAF(origin:()=>any):(callback:()=>void)=>any{
        return function(this:any,callback:()=>void){
            console.log("this is ",this);
            return origin.call(
                this,
                wrap(
                    callback,
                    {

                    }
                )
            )
        }
    }

}