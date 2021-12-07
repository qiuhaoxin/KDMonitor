

import {Backend as BackendInterface,BackendClass, Transport} from '../types/index';
import {Options} from '../types/index'
export abstract class Backend<O extends Options> implements BackendInterface{
    sendEvent(event: Event): void {
        throw new Error('Method not implemented.');
    }
    getTransport(): Transport {
        throw new Error('Method not implemented.');
    }

}