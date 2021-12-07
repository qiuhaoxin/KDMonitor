


import {Options,Integration} from '../types/index';
import {getCurrentHub,addGlobalEventProcessor} from '../hub'
export type IntegrationIdx={
    [key:string]:Integration;
} & {
    initialized?:boolean;
}


export const installedIntegrations:string[]=[];

export function setUpIntegrations<O extends Options>(options:O):IntegrationIdx{
    let integrationIdx : IntegrationIdx={};
    const integrations : Integration[]=getIntegrationsToSetup(options);
    integrations.forEach(integration=>{
        integrationIdx[integration.name]=integration;
        setUpIntegration(integration);
    })
    return integrationIdx;
}
function setUpIntegration(integration:Integration):void{
    if(installedIntegrations.indexOf(integration.name)!==-1)return;
    integration.setupOnce(addGlobalEventProcessor,getCurrentHub);
    installedIntegrations.push(integration.name);
}
export function getIntegrationsToSetup(options:Options):Integration[]{
    const defaultIntegrations=options.defaultIntegrations || [];
    const userIntegrations=options.integrations || [];
    let integrations=[...filterDuplicate(defaultIntegrations)];

    if(Array.isArray(userIntegrations)){
        integrations=[
            ...integrations.filter(i=>{
                return userIntegrations.every(userI=>userI.name!==i.name);
            }),
            ...filterDuplicate(userIntegrations),
        ]
    }else if(typeof userIntegrations=='function'){
        integrations=userIntegrations(integrations);
        integrations=Array.isArray(integrations) ? integrations : [integrations];
    }
    return integrations;
}

function filterDuplicate(integrations:Integration[]):Integration[]{
   return integrations.reduce((acc:Integration[],integration:Integration)=>{
        if(acc.every((accIntegration : Integration)=>accIntegration.name!==integration.name)){
            acc.push(integration);
        }
        return acc;
   },[] as Integration[])
}