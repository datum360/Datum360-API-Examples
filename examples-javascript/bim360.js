const authUrl = "https://developer.api.autodesk.com/authentication/v2/token";
const axios = require('axios');
const config = require('./config.json');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

async function authenticate(){
    if(!config.clientId || config.clientId == ""){
        console.log("Missing BIM360 Client ID")
    }

    if(!config.clientSecret || config.clientSecret == ""){
        console.log("Missing Client Secret");
    }
    
    const encodedAuth = Buffer.from(`${config.bim360ClientId}:${config.bim360ClientSecret}`).toString("base64");
    const data = "grant_type=client_credentials&scope=data:read";
    const reqconfig = {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${encodedAuth.toString()}`
        }
    };
    const tokenResponse = await axios.post(authUrl, data, reqconfig);
    return tokenResponse.data;
}

/**
 * 
 * @param {*} docUrn bim360 urn returned when submitting a file to bim360
 * @param {*} token bim360 token
 * @returns list of files to try to download
 */
async function getPropertyFiles(docUrn, token) {
    //This derivative service URL is not documented anywhere but it is used by the BIM360 viewer
    const url = `https://developer.api.autodesk.com/derivativeservice/v2/regions/eu/manifest/${docUrn}`;

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
    const response = await axios.get(url, config);
    const manifest = response.data;
    let filesToDownload = [];
    /*
    *   objects_attrs.json.gz - contains different attributes and metadata
    *   objects_vals.json.gz - contains de-duplicated attribute values
    *   objects_avs.json.gz - attribute-value pairs - offsets into objects_attrs and objects_vaks
    *   objects_ids.json.gz - object IDs
    *   objects_offs.json.gz - for each object ID at the same index in objects_ids.json.gz, this array defines an offset into the attribute-value list in objects_avs.json.gz
    */
    const propertyFiles = ["objects_attrs.json.gz", "objects_vals.json.gz", "objects_avs.json.gz", "objects_offs.json.gz", "objects_ids.json.gz"];
    for (let i = 0; i < manifest.children.length; i++) {
        const child = manifest.children[i];
        let derivatives2DURNPrefix = "";
        // Derivative manifest for 3D is embedded in .svf file which is a zip compressed folder
        const derivatives3DURNPrefix = `urn:adsk.viewing:fs.file:${docUrn}/output/`;
        // Derivative manifest for 2D is in a special file which has a fixed name
        if (child.role === '2d') {
            child.children.forEach((item) => {
                if (item.mime === "application/autodesk-f2d") {
                    derivatives2DURNPrefix = item.urn.replace(/\/output\/.+primaryGraphics.f2d/gi, "\/output\/");
                }
            });
        }
        propertyFiles.forEach((item) => {
            filesToDownload.push({ urn: `${derivatives2DURNPrefix}${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives2DURNPrefix}0/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives2DURNPrefix}1/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives2DURNPrefix}2/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives2DURNPrefix}3/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}0/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}1/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}2/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}3/${item}`, name: item, subFolder: child.role });
            filesToDownload.push({ urn: `${derivatives3DURNPrefix}Resource/${item}`, name: item, subFolder: child.role });
        });
        const tempMap = {};
        const tempArr = [];
        filesToDownload.forEach((item) => {
            if (tempMap[item.subfolder + item.urn] !== null) {
                if (!tempMap[item.subfolder + item.urn]) {
                    tempMap[item.subfolder + item.urn] = 1;
                    tempMap[item.subfolder + item.urn] = 1;
                    tempArr.push(item);
                    tempArr.push(item);
                }
            }
        });
        filesToDownload = tempArr;
    }
    return filesToDownload;
}

/**
 * 
 * @param {*} filesToDownload list of files to attempt to download
 * @param {*} saveFiles optionally save the files in this directory
 * @param {*} token bim360 token
 * @returns the contents of the downloaded files as an array of arrays
 */
async function downloadPropertyFiles(filesToDownload, saveFiles, token) {
    const propertyStorage = {};

    for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];
        const storePath = file.urn.replace(file.name, "") + file.subFolder;

        if (!propertyStorage[storePath]) {
            propertyStorage[storePath] = {
                attrs: null,
                ids: null,
                offs: null,
                vals: null,
                avs: null
            };
        }

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept-Encoding': 'gzip, deflate'
            },
            responseType: 'arraybuffer',
            responseEncoding: "arraybuffer"
        };
        const fileUrn = file.urn;
        const url = `https://developer.api.autodesk.com/derivativeservice/v2/derivatives/${fileUrn}`;

        try {
            const response = await axios.get(url, config);

            //remove objects_, .json and .gz from filenames
            const storeKey = file.name.replace(/objects_|\.json\.gz/gi, "");
            
            let jsonFile = null;
            const content = zlib.gunzipSync(response.data || response).toString("utf-8");

            if(saveFiles){
                let writeKey = file.name.replace(/objects_|\.json/gi, "");
                writeKey = file.name.replace(".gz", "");
                fs.writeFileSync(path.resolve(__dirname, writeKey), content);
            }

            if (['avs', 'offs'].indexOf(storeKey) > -1) {
                //these two are both arrays of numbers, basically arrays of offset values
                jsonFile = parseTextAsIntArray(content);
            }
            else {
                //everything else will be a mix of numbers and text
                jsonFile = parseTextAsTextArray(content);
            }
            propertyStorage[storePath][storeKey] = jsonFile;
        }
        catch (err) {
            //We will get here if the file we're trying to download doesnt exist
            console.log(err);
        }

    }
    const storageArr = [];

    for (const key in propertyStorage) {
        if (propertyStorage[key].offs != null && propertyStorage[key].offs.length > 0) {
            storageArr.push(propertyStorage[key]);
        }
    }

    return storageArr;
}

function parseTextAsIntArray(text) {
    // find out how many items we have
    let count = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ",")
            ++count;
    }
    // The last element does not have ','
    ++count;
    const items = new Uint32Array(count);
    let str = "";
    let ind = 0;
    const textLen = text.length;
    for (let i = 0; i < textLen; i++) {
        const char = text[i];
        if (char === "," || i === textLen - 1) {
            try {
                items[ind] = parseInt(str, 10) || 0;
                str = "";
                ++ind;
            }
            catch (err) {
                console.log(err);
            }
        }
        else {
            str += char;
        }
    }
    return items;
}

function parseTextAsTextArray(text) {
    // find out how many items we have
    text = text.replace(/^\[|\]$/g, "");
    const items = text.split(/,\r?\n/);
    for (let i = 0; i < items.length; i++) {
        try {
            items[i] = JSON.parse(items[i].replace(/\"/g, '\"'));
        }
        catch (err) {
            console.log(err);
        }
    }
    return items;
}

module.exports={authenticate, getPropertyFiles, downloadPropertyFiles};