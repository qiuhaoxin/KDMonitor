

import { getGlobalObject } from './global';
export function supportFetch(){
    const global=getGlobalObject<Window>();
    if(!('fetch' in global)){
        return false;
    }
    try{
        new Headers();
        new Request('');
        new Response();
    }catch(ex){
        return false;
    }
}

export function isInstanceOf(wat:any,base:any):boolean{
    try{
        return wat instanceof base;
    }catch(ex){
        return false;
    }
}

