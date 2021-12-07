import {Backend} from './Backend';

import {Options,Transport} from '../types/index'
export default class BrowserBackend extends Backend<Options>{
    sendEvent(event: Event):void{

    }
    getTransport():Transport{

    }
}