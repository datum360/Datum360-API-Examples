const authUrl = "https://developer.api.autodesk.com/authentication/v2/token";
const axios = require('axios');
const config = require('./config.json');
const fs = require('fs');
const os = require("os");
const path = require('path');

async function authenticate(){
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

async function getManifest(docUrn, region = "EU", token){
    const regionUrlPart = (region === 'EU' ? 'regions/eu/' : '');
    const url = `https://developer.api.autodesk.com/modelderivative/v2/${regionUrlPart}designdata/${docUrn}/manifest`;

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, br'
        }
    };
    
    const manifest = await axios.get(url, config);

    return manifest.data;
}

async function downloadDerivativeFile(docUrn, derivativeUrn, region = "EU", token){
    const regionUrlPart = (region === 'EU' ? 'regions/eu/' : '');
    const url = `https://developer.api.autodesk.com/modelderivative/v2/${regionUrlPart}designdata/${docUrn}/manifest/${derivativeUrn}`;

    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Accept-Encoding': 'gzip, deflate, br'
        },
        responseType: 'stream'
    };

    const derivativeResponse = await axios.get(url, config);

    const derivative = derivativeResponse.data;

    const folderPath = path.resolve(os.tmpdir(), docUrn);

    fs.mkdirSync(folderPath, {recursive: true});

    const filePath = path.resolve(folderPath, "propery.db");

    return new Promise((resolve, reject) => {
        derivative.pipe(fs.createWriteStream(filePath))
        .on('close', () => {
            resolve(filePath);
        })
        .on('error', (err) => {
            reject(err);
        });
    })     
}

module.exports={authenticate, getManifest, downloadDerivativeFile};