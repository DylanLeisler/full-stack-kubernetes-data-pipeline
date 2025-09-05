// @ts-check
import { parseCSV, buildTableTop, populateTableBody } from './core.js';
import { loadCSV, CSV_URL } from './io.js';
import * as R from 'ramda'
//import fetch from 'node-fetch'

const { pipeWith, andThen, tap } = R


const display = (url, unpivot = false) => 
    pipeWith(andThen, 
        [() => loadCSV(url), 
         data => parseCSV(data, unpivot), 
            // tap(console.log), 
            buildTableTop, 
            populateTableBody, 
            tap(data => data['container'].appendChild(data['table']))
        ]
    )();

display(CSV_URL, true).then(() => console.log('CSV Displayed!'));


export { loadCSV, parseCSV };



