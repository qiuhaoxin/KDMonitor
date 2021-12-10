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
    history:true,
    fetch:true,
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
            fetch:true,
            history:true,
            ...options
        }
    }
    setupOnce(addGlobalEventProcessor: (callback: EventProcessor) => void, getCurrentHub: () => Hub): void {
        console.log("set up timeline!!!");
        if(this._options.console){
            this._instrumentConsole();
        }
        if(this._options.fetch){
            this._instrumentFetch();
        }
        if(this._options.XMLHttpRequest){
            this._instrumentXHR();
        }
        if(this._options.history){
            this._instrumentHistory();
        }
        if(this._options.dom){
            this._instrumentDom();
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

        addInstrumentHandler({
            callback:(...args)=>{
                console.log("instrumentDom is ",args);
                this._domTimeLine(args);
            },
            type:'dom',
        })
    }
    private _domTimeLine(...args:any[]){
        console.log("dom timeline args is ",args);
    }
    private _instrumentFetch(){
        addInstrumentHandler({
            callback:()=>{
                this._fetchTimeLine();
            },
            type:'fetch',
        })
    }
    private _fetchTimeLine(...args:any[]){
        console.log("fetch time line is ",args);
    }
    private _instrumentHistory(){

    }
    private _instrumentXHR(){

    }
    
}