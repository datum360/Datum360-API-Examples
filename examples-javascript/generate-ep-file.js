const bim360 = require('./bim360.js');

//We use these to define what a tag should "look" like
//Add/Edit/Remove as necessary
const regexes = [
    "[0-9]{2,3}[-]{1,1}[a-zA-Z]{1,5}[-]{1,1}[0-9]{4,4}[-]{1,1}[0-9]{4,4}[-]{1,1}[0-9]{4,4}",
    "[0-9]{2,3}[-]{1,1}[a-zA-Z]{1,5}[-]{1,1}[a-zA-Z0-9]{1,4}",
    "[0-9]{2,3}[-]{1,1}[a-zA-Z]{1,5}[-]{1,1}[0-9]{4,4}[-]{1,1}[0-9]{4,4}[-]{1,1}[0-9]{4,4}",
    "[0-9]{2,3}[-]{1,1}[a-zA-Z]{1,5}[-]{1,1}[0-9]{4,4}[-]{1,1}[a-zA-Z0-9]{2,4}[-]{1,1}[a-zA-Z0-9]{2,4}",
    "[A-Za-z]{2,3}[-]{1,1}[0-9]{3,4}"
]

async function init(documentUrn){
    let bimToken = await bim360.authenticate();
    //get list of files to download for the document
    const docs = await bim360.getPropertyFiles(documentUrn, bimToken.access_token);

    //download the files
    const storageArr = await bim360.downloadPropertyFiles(docs, true, bimToken.access_token);
    
    let tags = retrieveDocAttributes(storageArr);
    console.log(tags);
}

function retrieveDocAttributes(storeArr){
    const tagImportArray = [];

    storeArr.forEach( (store) => { 
        if (store == null || store.offs.length === 0){
          return;
        }
    
        const objectCount = store.offs.length - 1;
    
        // To eliminate lots of IF procesing, we define the function that handles the value assignment
        let functionToAssignVal = null;
   
        //Use tag formats to identify tags
        if (regexes) {
          functionToAssignVal = (val) => {
              let output = [];
    
              if(val) {
                  for(let i = 0; i < regexes.length; i++){
                    const tagFormat = regexes[i];
                    //^ and $ to match the whole string
                    try{
                      if(tagFormat.length == 0){
                        continue;
                      }
                      const match = val.match(new RegExp(`^(${tagFormat})$`, "g"));
                      if (match != null) {
                          output = match;
                          break;
                      }
                    }
                    catch(err){
                      //Possibly caused by invalid regex format
                      console.log(err);
                    }
                  }
              }
              return output; 
          }
        }
  
        for (var i = 0; i <= objectCount; i++) {
          const tagList  = [];
    
          // Start offset of this object's properties in the Attribute-Values table
          const propStart = 2 * store.offs[i];
    
          // End offset of this object's properties in the Attribute-Values table
          const propEnd = 2 * store.offs[i + 1];
    
          // Loop over the attribute index - value index pairs for the objects
          // and for each one look up the attribute and the value in their
          // respective arrays.
          for (let j = propStart; j < propEnd; j += 2) {
    
              const attrId = store.avs[j];
              const valId = store.avs[j + 1];
              
              const attr = store.attrs[attrId];
    
              if (store.vals[valId]) {
                
                  let val = store.vals[valId].toString();
                  let attrName = null;
    
                  if(attr[1]) {
                      attrName = attr[5] ? `${attr[1]}.${attr[5]}` : `${attr[1]}.${attr[0]}`;
                  } else {
                      attrName = attr[5];
                  }
                
                  let matches = [];
  
                  if(attrName){
                    if(functionToAssignVal != null){
                        matches = functionToAssignVal( val);
                    }
                  }

                  // ignore the items that have only DBId and ExternalID
                  if (matches && (matches.length > 0)) {
                    matches.forEach((tagNo) => {
                        if (tagNo) {
                             if(!tagList.includes(tagNo)){
                              tagList.push( tagNo );
                             }
                        }
                    })
                }
              }
          }
          
          if(tagList.length > 0) {
            tagList.forEach( (tag) => {
                // Add entry to tag import list
                tagImportArray.push( {
                  TagNumber: tag,
                  DbId: i.toString()
                } );
            })
          }
        }  
      });
    return tagImportArray;
}

//Pass BIM360 Document URN here
init("");