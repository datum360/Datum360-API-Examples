const axios = require('axios').default;
const fs = require('fs');
const formData = require('form-data');
const path = require('path');
const utils = require('./utils.js');

async function pim360Import(){
    const accessToken = await utils.getAccessToken();
    const readStream = fs.createReadStream(path.join(__dirname, 'LiveView.xlsx'));
    const eicHdl = "TTYSY8_xTa26ANFMeKaXSw";
    const etlSourceHdl = "jTtqE13-SRi0Gk30LIc9xQ";
    const objectType = "TAGGED_ITEM";
    const classification = "cls"

    var form = new formData();
    form.append("upFile", readStream);
    form.append("eicHdl", eicHdl);
    form.append("etlSourceHdl", etlSourceHdl);
    form.append("objectType", objectType);
    form.append("classification", classification);

    const formHeaders = form.getHeaders();
    const axiosConfig = {
        headers:{
            ...formHeaders,
            Connection: 'keep-alive',
            Authorization: `Bearer ${accessToken}`
        },
        maxContentLength: 500000000,
        maxBodyLength: 500000000
    }

    let response = await axios.post("https://example-system.pim360.io/api/etl_queue/activities/wide_import", form, axiosConfig);

    let completedActivityResponse = await utils.checkActivityStatus(response.data.data.etlActHdl, accessToken);
    if(completedActivityResponse.Status == "Complete"){
        console.log("Import sucessfully complete");
    }
}

pim360Import();