const ServiceBus = require('@azure/service-bus');
const Config = require('./config.json');
async function getMessages(){
    const topic = "cls360";

    let sbClient = new ServiceBus.ServiceBusClient(Config.ConnectionString);

    let receiver = sbClient.createReceiver(topic, Config.Subscription);

    //A message can be received only the amount of times that Max Delivery count is specified in Azure
    const messages = await receiver.receiveMessages(100000, {maxWaitTimeInMs: 5000})
    for(let message of messages){
        //Logging full message
        console.log(message.applicationProperties.routingKey);

        //Logging individual properties
        console.log(`Domain hdl: ${message.applicationProperties.domainHdl}`);
        console.log(`Class hdl: ${message.applicationProperties.hdl}`);
        console.log(`Operation: ${message.applicationProperties.operation}`);
    }
}

getMessages();