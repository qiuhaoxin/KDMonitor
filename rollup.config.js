
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
const plugins=[
    typescript({
        tsconfig:'tsconfig.json',
    }),
    resolve({
        mainFields:['module']
    }),
    commonjs(),
]
export default [
    {
        input:'./src/index.ts',
        output:{
            name:'KDMonitor',
            format:'iife',
            sourcemap:true,
            strict:false,
            file:'bundle.js'
        },
        context:'window',
        plugins,
    }
]