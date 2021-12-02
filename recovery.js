const axios = require('axios');
const fs = require("fs")
const path  = require('path');


// make request to edge-server to get faulty files
const getFaultyFiles = async () => {
    const response = await axios.get('http://edge-node/compare');
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
        const {data} = await axios.get(`http://edge-node/fetch?file=${file}`)
        console.log({data})

        if (data.error === true){
            console.error(`[cache:miss] : ${file}`);
        } else {
            fs.writeFileSync(path.join(__dirname, file), data.payload);
            console.log(`[cache:rewritten] : ${file}`);
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