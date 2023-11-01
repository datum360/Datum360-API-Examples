const bim360 = require('./bim360.js');
const sqlite3 = require('sqlite3').verbose();

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

    //If we decode the documentURN we can find out if it was uploaded to a 
    //US or EU BIM360/ACC
    let buffer = new Buffer(documentUrn, "base64");
    let decoded = buffer.toString("ascii");
    const region = (decoded.indexOf('emea') > -1 ? 'EU' : 'US');

    //Get information about the derivative
    const manifest = await bim360.getManifest(documentUrn, region, bimToken.access_token);

    //Find the section with the property database details
    const propertyDb = getDbFromManifest(manifest);
    if(!propertyDb){
      return;
    }

    //Retrieve the SQLite database
    const propertyDbPath = await bim360.downloadDerivativeFile(documentUrn, propertyDb.urn, region, bimToken.access_token);
    let db = new sqlite3.Database(propertyDbPath);

    const tagImportList = await getTagsFromDatabase(db,regexes, "");
    
    
    console.log(tagImportList);
}

/**
   * Given a manifest response, get details of the property database
   * @param {*} manifest 
   * @returns 
   */
function getDbFromManifest(manifest){
  for(const derivative of manifest.derivatives){
      const propertyDb = derivative.children.find((child) => child.role == "Autodesk.CloudPlatform.PropertyDatabase");
      return propertyDb;
  }
}

/**
   * Retrieve a list of a tags from a deriviative properties database
   * @param {*} db Database to use
   * @param {*} pimConfig Config information from PIM360 EIC
   * @param {*} regexes List of regexes to find tags
   * @returns 
   */
async function getTagsFromDatabase(db, regexes, tagAttributeField = null){
  //Get all the drawing attributes from the table "_object_attr"
  let allAttributes = await getAllAttributes(db);
  let foundAttributes = [];

  const matchingAttr = allAttributes.find((attr) => attr.name == tagAttributeField);
  if(matchingAttr){
    foundAttributes.push(matchingAttr);
  }

  //if no attributes have been provided, search across all
  if(!tagAttributeField){
    foundAttributes = allAttributes;
  }

  const eavs = await getAttributeEavs(db, foundAttributes);

  const valueIds = eavs.map((eav) => eav.value);
  const values = await getValues(db, valueIds);

  let functionToAssignVal = null;
  //Use tag formats to identify tags
  if (regexes && regexes.length > 0) {
    functionToAssignVal = (val) => {
        let output = null;

        if(val) {
            for(const tagFormat of regexes){
              try{
                //^ and $ to match the whole string
                const match = val.toString().match(new RegExp(`^(${tagFormat})$`, "g"));
                if (match != null) {
                    output = match;
                    break;
                }
              }
              catch(err){
                console.log(err);
              }
            }      
        }
        return output; 
    }
  }

  const tagImportList = []

  for(const val of values){

    let match = null;
    if(functionToAssignVal){
      match = functionToAssignVal(val.value);
    }
    else{
      match = val;
    }

    if(match == null){
      continue;
    }

    //value matches regex
    //find eav for this value
    const matchingEav = eavs.find((eav) => eav.value == val.id);
    
    if(matchingEav == null){
      continue;
    }

    tagImportList.push({
      TagNumber: val.value,
      DbId: matchingEav.entity
    });
  }

  return tagImportList;
}

/**
   * From the property database, get a list of all attributes
   * @param {*} database SQLite3 Database
   * @returns 
   */
async function getAllAttributes(database){
  const getAllAttributesQuery = `SELECT id, (IIF(category IS NOT NULL AND category != "" , category || "." || name, name)) AS "attribute" FROM "_objects_attr"`;
  return await queryPropertyDatabase(database, getAllAttributesQuery, (row) => ({ id: row.id, name: row.attribute }));
}

/**
 * Querys the EAV (Entity, Attribute, Value) table in the database to get the EAVs that match the attribute Ids provided
 * @param {*} database SQLite3 database
 * @param {*} attributes array of attribute ids
 * @returns 
 */
async function getAttributeEavs(database, attributes){
  const attributeIds = attributes.map((attr) => attr.id);
  const attributeIdString = attributeIds.join(",");
  const attributeEavQuery = `SELECT * FROM _objects_eav where attribute_id IN (${attributeIdString})`;

  return await queryPropertyDatabase(database, attributeEavQuery, (row) => ({
    entity: row.entity_id,
    attribute: row.attribute_id,
    value: row.value_id,
  }))
}

/**
 * Query the database for values that have the id provided
 * @param {*} database SQLite3 database  
 * @param {*} valueIds array of value ids
 * @returns 
 */
async function getValues(database, valueIds){
  const valueIdString = valueIds.join(",");
  const valueQuery = `SELECT * FROM _objects_val WHERE id IN (${valueIdString})`;

  return await queryPropertyDatabase(database, valueQuery, (row) => ({ id: row.id, value: row.value }))
}


async function queryPropertyDatabase(database, sqlQuery, mapFunction) {
  return new Promise((resolve, reject) => {
      const results = [];
      database.each(sqlQuery, (err, row) => {
        if (!err) {
          results.push(mapFunction(row));
        }
      }, (err, complete) => {
        if (err) {
          reject(err);
        } else {
          resolve(results);
        }
      });
  });
}

//Pass BIM360/ACC Document URN here
init("");