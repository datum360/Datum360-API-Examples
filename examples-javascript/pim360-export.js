const path = require('path');
const utils = require('./utils.js');
const axios = require('axios').default;

async function pim360Export(){
    const accessToken = await utils.getAccessToken();
    
    const exportParameters = {
        liveviewHdl: "U3LU480dSISM75A7iJRtQQ",
        etlTargetHdl: "4_bLCTIdRoy1KHChEd5A9g",
        outputFormat: "xlsx",
        outputFilename: "test.xlsx",
        eicHdl: "Pi6oMK48SlyGfbVmOWoxbQ"
    }

    let axiosConfig = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }

    //submits the activity to PIM360
    let response = await axios.post("https://example-system.pim360.io/api/etl_queue/activities/export", exportParameters, axiosConfig);

    //wait for export to complete
    let completedActivityResponse = await utils.checkActivityStatus(response.data.response.act_handle, accessToken);

    //get the file details from the completed activity
    let generatedAttachment = completedActivityResponse.Tasks[0].Attachments[0];

    //download generated file from PIM360
    let fileStream = await getPimFile(generatedAttachment.Hdl, accessToken);

    //save file to disk
    await utils.copyStreamToFile(fileStream.data, path.join(__dirname, 'output.xlsx.zip'))
}

/**
 * Downlaods a file from PIM360
 * @param {string} fileHdl Handle of the file to download
 * @param {string} accessToken Valid access token
 * @returns A stream of the file being downloaded
 */
async function getPimFile(fileHdl, accessToken){
    let axiosConfig = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        },
        responseType: 'stream'
    }

    let fileResponse = await axios.get(`https://example-system.pim360.io/api/file/${fileHdl}`, axiosConfig);
    return fileResponse;
}

pim360Export();