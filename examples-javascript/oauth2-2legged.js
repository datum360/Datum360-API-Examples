const axios = require('axios').default;
const config = require('./config.json');

getAccessToken();

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






