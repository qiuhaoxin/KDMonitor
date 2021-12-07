import BaseClient from "./BaseClient";
import {Options,Backend} from '../types/index'
import BrowserBackend from '../backends/BrowserBackend';

export default class BrowserClient extends BaseClient<Backend,Options>{
    constructor(options:Options){
        super(BrowserBackend,options);
    }
}