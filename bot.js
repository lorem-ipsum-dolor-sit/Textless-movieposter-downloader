const fetch = require('node-fetch'),
    fs = require('fs'),
    fsp = require('fs').promises,
    path = require('path'),
    zip = require('7zip-min');

const folder = {download: path.join(__dirname, "download"), unpack: path.join(__dirname, "unpacked")};

/**
 * Checks if the folder exist
 * if not it creates the missing one.
 */
for (dir in folder) {
    if (!fs.existsSync(folder[dir])) {
        console.log(`Folder [${dir}] created. (${folder[dir]})`);
        fs.mkdirSync(folder[dir]);
    }
}


const search = {entity: "movie", term: process.argv[2] || "Avengers: Infinity War"}; // Procress ARGUMENT or the default search term

fetch(`https://itunes.apple.com/search?term=${search.term}&entity=${search.entity}`)
    .then(res => res.json())
    .then(res => {
        if (res.results.length > 0) {
            return res.results
        } else {
            throw `Not Found [${search.term}]`
        }
    })
    .then(results => results[0])
    .then(result => {
        const download = result.artworkUrl30.replace(/(https:\/\/.+)thumb\//, "http://a5.mzstatic.com/us/r30/");
        const name = result.trackName.replace(/\s|\W/g, "-");
        return {
            url: download.replace(/source\/.*\.jpg|$/, `source`),
            name: name,
            path: path.join(folder.download, `${name}.lsr`) // its a LSR file
        };
    })
    .then(download)
    .catch(errorHandling);

/**
 * Download the file and saves.
 * @param file
 * @returns {Promise<T>}
 */
async function download(file) {
    return await fetch(file.url)
        .then(x => x.arrayBuffer())
        .then(source => save(file, source))
        .catch(errorHandling);
}

/**
 * Saves the file and unpacks
 * @param file
 * @param arrayBuffer
 * @returns {Promise<T>}
 */
async function save(file, arrayBuffer) {
    return await fsp.writeFile(file.path, Buffer.from(arrayBuffer))
        .then(() => unpack(file))
        .catch(errorHandling);
}

/**
 * Unpack the LSR file
 * @param file
 * @returns {Promise<void>}
 */
async function unpack(file) {
    zip.unpack(file.path, path.join(folder.unpack, file.name), errorHandling)
}

/**
 * Just an error handler
 * @param err
 */
function errorHandling(err) {
    if (err) console.log(err);
    else console.log(`Done`)

}