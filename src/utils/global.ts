
import {EventProcessor, Hub} from '../types/index';
import {isNodeEnv} from './index';
export interface KDMonitorGlobal{
    __KDMonitor__:{
        hub:Hub,
        eventProcessors:EventProcessor[]
    }
}

export function getGlobalObject<T>():T | KDMonitorGlobal{
    return (
        isNodeEnv()
        ? global
        : typeof window!=='undefined'
        ? window
        : typeof self!=='undefined'
        ? self
        : {}
    ) as T | KDMonitorGlobal;
}