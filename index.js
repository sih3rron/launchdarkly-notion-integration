import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import fetch from 'node-fetch';

dotenv.config()
const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID

//Retrieve Flag Metadata from LaunchDarkly
async function retrieveFlagData(){
  const allFlags = `https://app.launchdarkly.com/api/v2/flags/${process.env.LD_PROJECT}?filter=filterEnv:${process.env.LD_ENVIRONMENT}`;
  //Fetch() Config
  let getConfig = {
      "method": "GET",
      "headers": {
          "Content-Type": "application/json",
          "authorization": process.env.LD_KEY,
          "LD-API-Version": "beta"
      }
  }

  try {
      const response = await fetch(allFlags, getConfig)
      const json = await response.json()
      const myData = json.items
      let trimmedData = []
      myData.map((flag, i)=>{
        const dataMap = {
          key: flag.key,
          name: flag.name,
          description: flag.description,
          created: new Date(flag.creationDate).toISOString(),
          modified: new Date(flag.environments.production.lastModified).toISOString(),
          active: flag.environments.production.on,
          tags: flag.tags,
          url: flag.environments.production._site.href,
          maintainerFirstname: flag._maintainer.firstName,
          maintainerLastname: flag._maintainer.lastName,
        }
        addPages(dataMap)
      })

  }
  catch (error){
      console.log(error)
  }
}
retrieveFlagData()

//Create Notion Database items and insert into a named Database.
async function addPages(dataMap) {
  try {
    const response = await notion.pages.create({
      parent: { 
        database_id: databaseId 
      },
      properties: {
        "URL": {
          url: `https://app.launchdarkly.com${dataMap.url}`
        },
        "Flag Key": { 
          rich_text:[
            {
              "text": {
                "content": dataMap.key
              },
              "annotations": {
                  "bold": true,
                  "italic": false,
                  "strikethrough": false,
                  "underline": false,
                  "code": false,
                  "color": "default"
              }
            }
          ]
        },
        "Name": { 
          title:[
                  {
                    "text": {
                      "content": dataMap.name
                    }
                  }
               ]
        },
        "Maintainer": { 
          rich_text:[
            {
              "text": {
                "content": `${dataMap.maintainerFirstname} ${dataMap.maintainerLastname}`
              }
            }
          ]
        },
        "Description": { 
          rich_text:[
            {
              "text": {
                "content": dataMap.description
              }
            }
          ]
        },
        "Status": { 
          rich_text:[
            {
              "text": {
                "content": dataMap.active ? "Active" : "Draft"
              },
              "annotations": {
                  "bold": true,
                  "italic": false,
                  "strikethrough": false,
                  "underline": false,
                  "code": false,
                  "color": dataMap.active ? "green" : "orange"
              }
            }
          ]
        },
        "Date Added": { 
          date: {
                "start": dataMap.created
              }
        },
        "Date Last Modified": { 
          date: {
                "start": dataMap.modified
              }
        },
      },
    })
    console.log(response)
    console.log("Success! Entry added.")

  } catch (error) {
    console.error(error.body)
  }
}


