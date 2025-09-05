// db.js
import { pipeWith, andThen, tap } from 'ramda';
import { loadCSV, CSV_URL } from './io.js';
import { parseCSV } from './core.js';
import pkg from 'pg'
import copyFrom from 'pg-copy-streams'
import { Readable } from 'stream'


const { Client } = pkg;
const copyString = copyFrom.from



const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password',
  database: 'testdb'
});

const pipe_update_query = (url, unpivot = false) => 
    pipeWith(andThen, 
        [ async () => {
            console.log(`Loading CSV from ${url} with unpivot=${unpivot}`)},
            () => loadCSV(url),
            tap(console.log),
            data => parseCSV(data, unpivot), 
            // tap(console.log),
            ({ lines }) => lines.flat(),
        ]
    );


async function run(data, dryRun=false) {
  await client.connect();

  const update_query = 'COPY population_by_year (year, country, population) FROM stdin WITH (FORMAT csv)'
 
  const copyStream = dryRun
  ? null
  : client.query(copyString(update_query))
  

  const rs = new Readable({ read() {} });
  const func = dryRun
    ? console.log 
    : rs.push.bind(rs);
  data.forEach(([year, country, pop]) => {
      func(`${year},${country},${Math.trunc(pop * 1e6)}\n`);
  })
  console.log('Pushing null to end stream')
  rs.push(null); // Signal end of stream

  try{
    if (!dryRun) {
      rs.pipe(copyStream);
      await new Promise((resolve, reject) => {
        copyStream.on('finish', resolve);
        copyStream.on('error', reject);
      });
      console.log('Data successfully copied to database');
    } else {
      console.log("Dry run: Data prepared but not copied to database");
    }
  } catch (err) {
    console.error('Error during COPY operation', err);
  } finally {
    await client.end();
  }
}

await run(await pipe_update_query(CSV_URL, true)()
.then(console.log("pipe_update_query done"))
.catch(err => console.error(err)), 
false);
