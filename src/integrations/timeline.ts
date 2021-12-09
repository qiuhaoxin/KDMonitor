/**
 * 时间轴，如果配置了，可以记录用户操作
 * 主要包括用户点击click、press行为
 * XMLHttpRequest
 * console
 * fetch
 * history
 */

import { EventProcessor, Hub, Integration } from "../types/index";
import {addInstrumentHandler} from '../utils/instrument';
type TimeLineOptions ={
    console:true,
    dom:true,
    XMLHttpRequest:true,
    History:true,
    Fetch:true,
}
export default class TimeLine implements Integration{
    private static id:string="timeline";
    name: string=TimeLine.id;
    private _options:TimeLineOptions;
    public constructor(options?:TimeLineOptions){
        this._options={
            console:true,
            dom:true,
            XMLHttpRequest:true,
            Fetch:true,
            History:true,
            ...options
        }
    }
    setupOnce(addGlobalEventProcessor: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
        if(this._options.console){
            this._instrumentConsole();
        }
    }
    private _instrumentConsole(){
        addInstrumentHandler({
            callback:function(){
                console.log("after change console");
            },
            type:'console'
        })
    }
    private _instrumentDom(){

    }
    private _instrumentFetch(){

    }
    private _instrumentHistory(){

    }
    private _instrumentXHR(){

    }
    
}