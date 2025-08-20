// @ts-check

import { pipeWith, andThen, tap } from 'https://cdn.skypack.dev/ramda@0.31.3';

const LINES_ROW_TITLE_LIST = 6;
const LINES_DATA_INDEX_START = 7;
const HEADERS_INDEX_START = 4;

async function loadCSV(unpivot=false) {
    const response = await fetch('data.csv')
    if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
    const csvText = await response.text()
    return { csvText, unpivot }
}

async function parseCSV(data) {
    const { csvText, unpivot} = data

    const [headerLine, ...unpolished_lines] = csvText.split('\n');
    const table_title = unpivot 
        ? "Country Population Statistics." 
        : headerLine.split(',')[1].slice(HEADERS_INDEX_START)

    let headers = unpolished_lines.slice(LINES_ROW_TITLE_LIST)[0].replace(/, millions/g, '(m)').split(',');
    let lines = unpolished_lines.slice(LINES_DATA_INDEX_START)
    let countries;
    let unpivoted_lines = [];

    if (unpivot){
        headers.forEach(h => console.log(h));
        countries = headers.map(h =>
        h
            .trim() // remove leading/trailing whitespace
            .replace(/^"|"$/g, '') // remove quotes at start/end
            .replace(/^Population of /, '') // remove "Population of " at start
            .replace(/\(m\)$/, '') // remove (m) at end
        ).filter(h => h !== "Year");
        //countries = headers.map(h => h.replace(/^Population of |\(m\)$/g, ''));
        // console.log("countries:")
        // console.log(countries)

        headers = ["Year", "Country", "Population(m)"]
        // console.log("lines:")
        // console.log(lines)
        lines.forEach(unsplit_y => {
            let y = unsplit_y.split(',')
            // console.log(y)
            countries.forEach((c, index) => {
                // console.log(c)
                unpivoted_lines.push([[`${y[0]}`, `${c}`, y[index+1]]])
            })
        })
        // console.log("unpivoted_lines:")
        // console.log(unpivoted_lines)
        lines = unpivoted_lines
    }
    else {
        lines = lines.map(line => line.split(','))
    }

    return { table_title, headers, lines };
}

const buildTableTop = (data) => {
    const { table_title, headers, lines } = data; 
    const container = document.getElementById('data-container')

    const table = document.createElement('table')
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    const title = document.createElement('caption')
    title.textContent = table_title;
    table.appendChild(title)
    
    //header row
    const trHead = document.createElement("tr");
    headers.forEach((/** @type {string} */ h) => {
        const th = document.createElement('th')
        th.textContent = h;
        th.style.border = '1px solid #ccc';
        th.style.padding = '4px 8px';
        trHead.appendChild(th);
    });
    table.appendChild(trHead);

    return { table, headers, lines, container }
}

const populateTableBody = (tableAndFriends) => {
    const { table, lines, container } = tableAndFriends;

//data rows
    lines.forEach(line => {
        const tr = document.createElement('tr');
        line[0].forEach(cell => {
            const td = document.createElement('td');
            // console.log(cell)
            td.textContent = cell;
            td.style.border = '1px solid #ccc';
            td.style.padding = '4px 8px';
            tr.appendChild(td);
        });
        table.appendChild(tr);
    })

    // container.innerHTML = '';
    // container.appendChild(table);
    // container.textContent = headers
    // container.textContent = `${data.headerLine}\n${data.lines.join('\n')}`;
    return { table, container }
}

// const unpivot = pipeWith(andThen, [loadCSV, ])

// unpivot().then(() => console.log('File Unpivoted.'));

const display = (unpivot = false) => 
    pipeWith(andThen, 
        [() => loadCSV(unpivot), 
            parseCSV, 
            tap(console.log), 
            buildTableTop, 
            populateTableBody, 
            tap(data => data['container'].appendChild(data['table']))
        ]
    )();

display(true).then(() => console.log('CSV Displayed!'));



