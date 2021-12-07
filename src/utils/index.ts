


export function isNodeEnv():boolean{
    const result:boolean=Object.prototype.toString.call(typeof process!='undefined' ? process : 0)==='[object process]'
    return result;
}