import * as dotenv from "dotenv";
dotenv.config({ path: __dirname+'/.env' });
//const { Client } = require("@notionhq/client")

import {Client} from "@notionhq/client";
import axios from "axios";

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION,
});

function refreshDb() {
    if((!process.env.NOTION_DB_ID) || (!process.env.NOTION_DB_ID_PROP) || (!process.env.NOTION_DB_PRICE_PROP)) throw new Error("Missiog ENV Variables");
    notion.databases.query({
        database_id: process.env.NOTION_DB_ID
    }).then(res => {
        let results = res.results;
        results.forEach(row => {
            let pageId = row.id;
            //@ts-ignore
            if(row.properties[process.env.NOTION_DB_ID_PROP].type == "rich_text") {
                //@ts-ignore
                let gid = row.properties[process.env.NOTION_DB_ID_PROP].rich_text[0].plain_text
                //console.log(gid)
                axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${gid}&vs_currencies=usd`).then(res => {
                    if(Object.keys(res.data).length === 0 && res.data.constructor === Object) {
                        console.error("Response empty");
                    }
                    let price = parseFloat(res.data[gid].usd.toPrecision(3));
    
                    notion.pages.update({
                        page_id: pageId,
                        properties: {
                            //@ts-ignore
                            [process.env.NOTION_DB_PRICE_PROP]: {
                                number: price
                            }
                        }
                    })
                })
            } 
            
        })
    })
}

var CronJob = require('cron').CronJob;
var job = new CronJob('1 1 * * * *', function() {
    console.log((new Date()).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}), "cron");
    refreshDb();
}, null, true, 'Europe/Paris');

job.start();