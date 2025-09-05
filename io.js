const CSV_URL = 'data.csv'

async function loadCSV(url) {
        let csvText


        let isLocal = false
        try {
            const response = await fetch(url)
            if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
            csvText = await response.text()
        } catch (error) {
            if (error.name === 'FetchError' || 
                error.name === 'TypeError' ||
                error.cause?.code === 'ENOTFOUND')
            {
                console.log("Network error, trying local file...");
                isLocal = true;
            } else {
                throw error; // rethrow for non-network issues
            }
        }


        if (typeof window === 'undefined' && isLocal) {
        try {
                const { readFile } = await import('fs/promises');
                csvText = await readFile(new URL(url, import.meta.url), 'utf-8');
            } catch (error) {
                console.log("Error reading local CSV file");
                console.error(error);
                throw error
            }
        }



    return { csvText }
}


export { CSV_URL, loadCSV}