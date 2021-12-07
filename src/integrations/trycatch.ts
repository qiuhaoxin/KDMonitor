

import {EventProcessor, Hub, Integration} from '../types/index'
import { getGlobalObject } from '../utils/global';
import {fill,wrap} from '../utils/instrument';
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
        const global=getGlobalObject();
        if(this._options.setTimeout){
            fill(global,'setTimeout',this._wrappedTimeout.bind(this));
        }
        if(this._options.setInterval){
            fill(global,'setInterval',this._wrappedTimeout.bind(this));
        }
        if(this._options.XMLHttpRequest){
            
        }
        if(this._options.requestAnimationFrame){
            fill(global,'requestAnimationFrame',this._wrapRAF.bind(this));
        }
        if(this._options.eventTarget){

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