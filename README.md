![](https://www.datum360.com/assets/img/datum360_email_logo.png)

# Datum360 API

Datum360 APIs allow developers to programmatically use any functionality that is available within the Connected Data Platform (CDP) interface.  This provide a powerful mechanism for creating integrations between applications to support a rich ecosystem landscape.

Exporting data is simple with GET APIs that enable users to export data in a variety of methods as you can within the CDP.   For example accessing saved LiveViews, run a tag to document association report or query individual objects and retrieve their data. 

Importing data is still controlled via an EIC within PIM360. The POST APIs can be used to create EICs, create activities and automate the import of data and associations.   

The data returned from the APIs is in json format. This can then be utilised and manipulated according to a specific use case in a wide variety of infrastructure set ups and coding/integration tools. For example using AWS Lambdas or Azure functions.


# Accessing Datum360 API

To get started with the API take a look at the API docs on each system (CLS360, PIM360, DDM360). To access the API docs, log into a system and then navigate to /api-docs e.g
`https://example-system.cls360.io/api-docs`

It is also accessible by navigating through the menu on the top right of the screen in the PIM360/CLS360/DDM360 user interface and then selecting "API Documentation"

![](/images/API_documentation.png)

On the documentation page click on the green "Authorize" button towards right after the description

![](/images/API_authbutton.png)

A dialog box then pops up showing the information required for both 2-legged and 3-legged OAuth2 authentication. This includes: Authorization URL, Token URL and Scope

![](/images/API_authorisation.png) 


## Code Examples

### Authentication via OAuth2 3-legged flow
oauth2-3legged.js gives an example of how to authenticate with the Datum360 API via the 3-legged oauth2 flow using passport.js.

To authenticate with a system (PIM360, CLS360, DDM360) replace "example-system" in the authorization and token urls with the ACL url of the required system to be authenticated with. For example in NodeJS, using passport we use: 

    passport.use(new OAuth2Strategy({
        authorizationURL: "https://example-system.acl360.io/oauth2/authorize",
        tokenURL: "https://example-system.acl360.io/oauth2/token",
        clientID: "example-username",
        clientSecret: "example-password",
        callbackURL: 'http://localhost:8000/',
        scope: ["example-system-pim360", "example-system-cls360"]
    }

Where the values for each parameter can be found in the [config file](/examples-javascript/config.json). The callbackURL is a url in your own application.

A valid account for the system you are trying to authenticate with is required.  It is recommened to have a "service account" for API usage rather than a users personal account. Enter the username and password for this account against clientID and clientSecret

Include the services (PIM360, CLS360, DDM360) you wish to authenticate against in the scope of the passport request, this can be an array to include multiple services.

### Authentication via OAuth2 2-legged flow
The 2-legged flow is demonstrated using a simple request using the Axios library as little benefit is gained from using Passport for this. Here a clientID, clientSecret and scope(s) are still needed to authenticate and an authorization (JWT) token will be returned.

The parameters required for the request are below:

    {
        grant_type = "client_credentials",
        client_id = "username",
        client_secret = "password",
        scope = "example-system-pim360"
    }

where `username` and `password` should be replaced with valid credentials for the PIM360/CLS360/DDM360 system being authenticated against. It is recommened to have a "service account" for API usage rather than a users personal account.

`example-system-pim360` should be replaced with the system being authenticated against, this can be found in the URL e.g `https://example-system.pim360.io/`. For example:

    https://example-system.pim360.io == example-system-pim360

    https://my-system.pim360.io == my-system-pim360


### PIM360 Wide Import
The provided example shows the minimum required fields to submit a wide import Activity to PIM360. These are:

* upfile: A file stream of the file containing the data to be uploaded. This can be xlsx, tsv, csv or txt. All of these file types can also be inside a zip file and uploaded

* eicHdl: The handle of the EIC to import the data into

* etlSourceHdl: The handle of the ETL source used to import the data

* objectType: The type of object to import, possible values: TAGGED_ITEM, DOCUMENT, EQUIPMENT_ITEM, EQUIPMENT_MODEL

* classification: classify by class name or ens. possible values: cls, ens


Note that the parameters must be sent as form data also that the parameters are case sensitive.

The request must also have included the bearer token in the request headers.


### PIM360 Export

The provided example shows how to submit an export activity to PIM360 and download the generated file. This is the equivelant of pressing the "export" button on the LiveView page in the UI. It is suitable for occassional expoorts of data, but if continuous querying is required then there are more suitable methods available. The minimum required parameters are:

* liveviewHdl: The handle of the liveview to export

* etlTargetHdl: The handle of the ETL Target used to export the data

* outputFormat: The format of the file being exported. Possible values: delimited, xlsx, json

* outputFilename: The name of the file to export


Submitting the export activity request will return details about the activity that has been submitted, however at this point the activity will not have completed. So from the activity the activity handle needs to be retrieved and submit it to the get activity endpoint, we repeat this until the activity has completed, either successfully or unsuccessfully. To do this there are some helper functions such as `checkActivtyStatus` in the JavaScript examples.

Once the activity has successfully finished it will contain the details of the file that has been generated. By retrieving the file handle this can then be submitted to the "get file" endpoint which will return a file stream, note that this request must set the "responseType" as "stream". The downloaded file will be a zip file so will need to be extracted once saved.

### Receiving Messaging Example
The messaging code example shows how to check for CLS360 messages and then read any available messages. This will need to be updated with the relevant connection string and subscription name used. 

When a message is received it will have the message properties available within message.applicationProperties. So in the example the handle of a newly created class can be retreived by doing:

`message.applicationProperties.hdl`

## Messaging

The Datum360 SaaS platform uses AMQP with RabbitMQ as the broker, to produce messages when actions are executed across CLS360, PIM360 and DDM360. These messages can then be received by a client, clients for different languages can be found [here](https://www.rabbitmq.com/devtools.html).

### CLS360 Messages
Message format:

` system.schema.(systemName).(objectType).(objectSubType).(operation).(domainHdl).(hdl) `

objectType can be one of:

* class
* template
* domain

objectSubType depends on the objectType, different values are listed below

domainHdl is the handle of the class library

hdl is the handle of the object being affected

for example:

` cls360.object.example-system-cls360.class.Functional.VersionClass.D34w5RS4rLSlXCd3RsfXVg.U2Dw-AwpTpqn8Y9rmDBbXQ `
#### Operations
* TerminateClass
* BulkTerminate
* RollbackClass
* CreateClass
* VersionClass (ie update)
* CreateTemplate
* VersionTemplate (ie update)

#### ObjectSubType for classes
* "Tag Number Format"
* "Data Source"
* "Numbering Specification"
* "Equipment Item"
* "Output Mapping"
* "Process"
* "Document"
* "Measure Attribute"
* "UoM Group"
* "UoM"
* "Data Target"
* "Attribute Mapping"
* "Functional"
* "Attribute Group"
* "Tag Code Mapping"
* "Discipline"
* "Equipment Model"
* "Register"
* "Information Attribute"

#### ObjectSubType for templates
* "Associations"
* "Alias"
* "Template"
* "Mapping"
* "Data"
* "Metadata"

#### ObjectSubType for domains
* "domain"


### PIM360 Messages

#### Object Modifications
Created when an object (e.g TAGGED_ITEM, DOCUMENT) has an action against it

Message format:

`system.schema.systemName.operation.objectType.objectSubType.eicHdl.srcHdl.facId.clsHdl.objHdl`

eicHdl is the handle of the EIC in which the change is made

srcHdl is the handle of the ETL Source that made the change

facId is the ID of the facility that the object belongs to

classHdl is the handle of the class type of the object

objectSubType can be one of:
* TAGGED_ITEM
* DOCUMENT
* EQUIPMENT_ITEM
* EQUIPMENT_MODEL

for example:

`pim360.object.example-system-pim360.Modify.object.TAGGED_ITEM.sQnHewpyQhqlM0h5fbqcPQ.jTtqE13-SRi0Gk30LIc9xQ.example-facility.OIXdU6UkR-SrTC2EmlZJxg.6H79HlOzQfCJkf1bB6B24w`

##### Operations
* Create
* Terminate
* Modify
* Unmanage (remove from EIC) 
* Publish

#### Attribute Modifications
Created when an attribute on an object has an action against it
Message format: 

`system.schema.systemName.operation.objectType.objectSubType.eicHdl.srcHdl.facId.clsHdl.objHdl.attrHdl`

for example: 

`pim360.object.example-system-pim360.Modify.attribute.TAGGED_ITEM.sQnHewpyQhqlM0h5fbqcPQ.jTtqE13-SRi0Gk30LIc9xQ.example-facility.OIXdU6UkR-SrTC2EmlZJxg.6H79HlOzQfCJkf1bB6B24w.SM9zH1fVe6KMWBbjmHAprQ`

#### Association Modifications
Created when an association has an action against it
Message format:

`system.schema.systemName.operation.objectType.eicHdl.fromObjectSubType.fromObjHdl.toObjectSubType.toObjHdl.assocHdl`

fromObjectSubType and toObjectSubType can be one of:

* TAGGED_ITEM
* DOCUMENT 
* EQUIPMENT_ITEM
* EQUIPMENT_MODEL

fromObjHdl is the handle of the source of the relationship

toObjHdl is the handle of the target of the relationship

for example:

`pim360.association.example-system-pim360.Modify.association.sQnHewpyQhqlM0h5fbqcPQ.TAGGED_ITEM.m14_QAepTDaTSRa4pafcZA.DOCUMENT.G_rkbPr2SkuFzWh8M1Ffcw."UlDw-AwpTpqn8Y9RmDBmXQ`

#### ETL Queue Operations
Created when the ETL queue is modified
Message format: 

`system.schema.systemName.objectType.activityId.operation.activityHandle.userHandle`

activityId is the id of the activity template being used (e.g IMPORT_OBJECT_WIDE, IMPORT_SNAPSHOT, PUBLISH_EIC)

operation can be one of:

* submit
* start
* complete

for example:

`pim360.etlQueue.example-system-pim360.Activity.IMPORT_OBJECT_WIDE.submit.Bz57qipbQuSL0psCt8d3LQ.fJcsSSzcTrqT5EFDCoeW5A`

### DDM360 Messages

#### Document updates
Created when a document is updated
Message format:

`system.schema.systemName.objectType.operation.doucmentHdl.newCurrentRevisonHdl`

Where newCurrentRevisonHdl is the revision handle after the update

for example:

`ddm360.documentUpdate.example-system-ddm360.document.update.pE9RkQA9THWXJXcI46hzww.RzoaboY8Qaa96pS5rcGPdQ`

#### Create deliverable
Created when a deliverable is created
Message format:

`system.schema.systemName.objectType.operation.eicHdl.pimDocHdl`

Where pimDocHdl is the handle of the associated document in PIM360

for example:

`ddm360.deliverableCreate.example-system-ddm360.deliverable.create.fdgzJU0-RTaB2HEhaVZQBg.C63EGe01TLWCJaujmB4Ukw`

### Deliver file to deliverable
Created when a file is added to a deliverable
Message format:

`system.schema.systemName.objectType.operation.documentHdl.pimDocHdl.revisionHdl.fileExtension`

documentHdl the handle of the document that the file was added to
pimDocHdl the handle of the related PIM360 document
revisionHdl the revision that the file was added to

for example:

`ddm360.deliverFile.example-system-ddm360.file.create.CoR3yCHDSfuuWGwGlsL2BA.wTVWSLISQ3WOwCk4951ZRA.WBymWntSQamq2oaGJ7uP_A.dwg`



