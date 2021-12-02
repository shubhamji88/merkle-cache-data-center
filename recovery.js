const axios = require('axios');
const fs = require("fs")
const path  = require('path');


const CONFIG = {
    EDGE_NODE: "http://edge-node",
    DATA_CENTER: "http://yashkumarverma-pdc-project.westus.cloudapp.azure.com"
}

// make request to edge-server to get faulty files
const getFaultyFiles = async () => {
    const response = await axios.get(`${CONFIG.EDGE_NODE}/compare`);
    return response.data;
}

const filterFilesFromFilesAndDirectoryList = (files) => {
    if(files.length === 0 || files === undefined || files === null ){
        console.log(`[cahce:perfect] no differences in the memory blocks`)
        return []
    }
    console.log(files)
    const filteredFiles = files.filter(file => file.includes('txt'));
    return filteredFiles;
}

const downloadFiles = async (filelist) => {
    for (let i = 0; i < filelist.length; i++) {
        const file = filelist[i];
        const {data} = await axios.get(`${CONFIG.DATA_CENTER}/fetch?file=${file}`)

        if (data.error === true){
            console.error(`[cache:miss] : ${file}`);
        } else {
            const pathOfFileToHeal = path.join(__dirname,'data', file)
            fs.unlink(pathOfFileToHeal, () => {
                console.log(`[cache:invalidated] : ${file}`);
                fs.writeFile(pathOfFileToHeal, data.payload, () => {
                    console.log(`[cache:rebuilt] : ${file}`);
                })
            })
        }
    }
}

const worker = async () => {
    const faultyFiles = await getFaultyFiles();
    const onlyFiles = filterFilesFromFilesAndDirectoryList(faultyFiles);

    // download and overwrite the data locally
    downloadFiles(onlyFiles);
}

worker()