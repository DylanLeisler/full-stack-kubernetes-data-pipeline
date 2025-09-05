// db.js
import { pipeWith, andThen, tap } from 'ramda';
import { loadCSV, CSV_URL } from './io.js';
import { parseCSV } from './core.js';
import pkg from 'pg'
import copyFrom from 'pg-copy-streams'
import { Readable } from 'stream'


const { Client } = pkg;
const copyString = copyFrom.from
const VANILLA_CSV_URL = 'file://' + CSV_URL;

console.log(VANILLA_CSV_URL)

let client
try {
  client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'testdb'
  });
} catch (error) {
  console.log("Error creating database client");
  console.error(error);
}

const pipe_update_query = (url, unpivot = false) => 
    pipeWith(andThen, 
        [ async () => {
            console.log(`Loading CSV from ${url} with unpivot=${unpivot}`)},
            () => loadCSV(url),
            tap(console.log),
            data => parseCSV(data, unpivot), 
            tap(console.log), 
        ]
    )();



// For testing

const values = await pipe_update_query(CSV_URL, true).then(console.log("pipe_update_query done"));
let entries = values['lines'].flat()
// entries.forEach(e => {
//   e.forEach(c => {
//   console.log('Year:', c[0], '\tCountry:', c[1], '\tPopulation:', c[2]*1e6);
//   })
// })
// entries.forEach(([year, country, pop]) => {
//     console.log(`${year}, ${country}, ${pop * 1e6}`);
// })


const update_query = 'COPY population_by_year (year, country, population) FROM stdin WITH (FORMAT csv)'


async function run() {
  await client.connect();

  const copyStream = await client.query(copyString(update_query));
  const rs = new Readable({ read() {} });
  entries.forEach(([year, country, pop]) => {
    rs.push(`${year},${country},${Math.trunc(pop * 1e6)}\n`);
  })
  rs.push(null); // Signal end of stream

    rs.pipe(copyStream)
    .on('finish', () => {
      console.log('COPY complete');
      client.end();
    })
    .on('error', err => {
      console.error('COPY failed', err);
      client.end();
    });
}

run().catch(err => console.error(err));
