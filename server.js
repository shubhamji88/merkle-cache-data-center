
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
const express = require("express")
const app = express()
const fs = require('fs');
var http = require('http');


const markle = async function makeTree () {
    // Exec output contains both stderr and stdout outputs
    const command = await exec('python2 mt.py')
  
    return { 
      stdout: command.stdout.trim(), 
    }
  };

app.get("/",(req, res)=>{
    return res.json({alive:true})
})

app.get("/tree", async (req, res)=>{
    const data = await markle()
    const parsed_json = JSON.parse(data.stdout)
    return res.json(parsed_json)
})

app.get("/fetch", async (req, res) => {
    const {file} = req.query;
    
    try{
        // load the contents of the file using fs module
        const data = await fs.readFileSync(`data/${file}`, 'utf8');
        return res.send({error:false, payload: data})

    }catch(e){
        return res.status(404).json({error:true, payload:{}})
    }
})

app.get("/compare", async (req, resp) => {
    const data = await markle()
    const clientJson = JSON.parse(data.stdout)
    var options = {
        host: 'yashkumarverma-pdc-project.westus.cloudapp.azure.com',
        path: '/tree',
    };
    http.get(options, function (res) {
        var bodyChunks = [];
        res.on('data', function (chunk) {
            bodyChunks.push(chunk);
        }).on('end', function () {
            var body = Buffer.concat(bodyChunks);
            const serverJson = JSON.parse(body);
            let differenceHashList = [];
            for (let hash in clientJson) {
                if (hash in serverJson === false) {
                    differenceHashList.push(hash);
                }
            }
            let differenceList = [];

            for (let hash in differenceHashList) {
                if (clientJson[differenceHashList[hash]][0] != 'data')
                    differenceList.push(clientJson[differenceHashList[hash]][0]);
            }
            if(differenceList.length === 0){
                return resp.json([])
            }
            return resp.json(differenceList);
        })
    });
    req.on('error', function (e) {
        console.log('ERROR: ' + e.message);
        return { error: 'try again' };
    });
})

app.listen(80, () => {
    console.log("Server is running on port :80")
})