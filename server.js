
const { promisify } = require('util');
const exec = promisify(require('child_process').exec)
const express = require("express")
const app = express()
const fs = require('fs');

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
        return res.send({error:true, payload: data})

    }catch(e){
        return res.status(404).json({error:true, payload:{}})
    }
})

app.listen(80, () => {
    console.log("Server is running on port :80")
})