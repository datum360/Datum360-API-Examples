const axios = require('axios').default;
const fs = require('fs');
const config = require('./config.json');

async function getAccessToken(){
    var options = {
        headers: {"content-type": "application/json"}
    }

    //requires username and password for client_id and client_secret
    //replace example-system-pim360 with {your system name}-pim360. Can also be an array of services
    var data = {
        grant_type: "client_credentials",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: config.pimScope
    }


    let response = await axios.post(config.tokenUrl, data, options);
    if(response.status == 200){
        //response.data should contain access_token and token_type
        return response.data.access_token;
    }
    else{
        return null;
    }
}

/**
 * Recursive function that checks until an activity has completed
 * @param {string} handle Handle of the activity to monitor
 * @param {string} accessToken Valid access token
 * @returns The Completed activity
 */
async function checkActivityStatus(handle, accessToken) {

    let axiosConfig = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }

    const activityResponse = await axios.get(`https://example-system.pim360.io/api/timeline?hdl=${handle}`, axiosConfig)
    // Return when we have a status
    if(activityResponse.data[0] && (activityResponse.data[0].Status == 'Complete' || activityResponse.data[0].Status == 'Failed')) {
            return activityResponse.data[0]
    } else {
        // Recheck the status in next 2 seconds
        return new Promise(resolve => {
            setTimeout(async () => {
                return resolve(await checkActivityStatus(handle, accessToken))
            }, 2000)
        })
    }
}

/**
 * Takes a file stream and writes it to disk
 * @param {FileStream} data the data to save
 * @param {string} filePath path to save the data
 * @returns {Promise}
 */
 async function copyStreamToFile(data, filePath) {
    
    let writeStream = fs.createWriteStream(filePath);
    writeStream.on('error', async(error) => {
      throw error.message;
    });
    
    return new Promise((res, rej) => {
        data.pipe(writeStream)
        .on('close', () => {
        return res(null);
        })
        .on('error', (error)=>{
          return rej(error);
        })
      })
  }


module.exports = {getAccessToken, checkActivityStatus, copyStreamToFile};