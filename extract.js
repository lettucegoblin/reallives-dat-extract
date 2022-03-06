const { resolvePtr } = require('dns');
var fs = require('fs');

const filePath = 'world.dat'
let buffer = fs.readFileSync(filePath)
var byteIndex = 0;

const bytes = {
    BYTE: 1,
    WORD: 2,
    DWORD: 4,
    LONG: 8,
    AS_NUM: true,
    AS_STRING: false
}

const columnTypes = {
    7430: "IndexField",
    2621441: "String",
    1: "",
    6: "Int",
    4: "Bool",
}
function concatBytes(index, howManyBytes, isInt = true){
    if(isInt){
        var combinedInt = 0;
        for(var i = 0; i < howManyBytes; i++){
            var shiftSize = i * 8;
            combinedInt += buffer[index + i] << shiftSize
        }
        return combinedInt;
    } else {
        var combinedString = ""
        for(var i = 0; i < howManyBytes; i++){
            combinedString += String.fromCharCode(buffer[index + i])
        }
        return combinedString
    }
}
function sliceBuffer(from, amount){
    return buffer.slice(from, from + amount).toString('hex');
}

function next01Index(byteIndex){
    while(buffer[byteIndex] !== 1){
        byteIndex++;
    }
    return byteIndex
}

function nextNonZeroIndex(byteIndex){
    while(buffer[byteIndex] == 0){
        byteIndex++;
    }
    return byteIndex
}
function nextIndex(byteIndex){
    while(buffer[byteIndex] !== rowCount + 1 && byteIndex < buffer.length){
        byteIndex++;
    }
    return byteIndex
}
//let rowCount = concatBytes(byteIndex, bytes.LONG)
let columnCount = concatBytes(byteIndex += 47, bytes.WORD)
//console.log(rowCount, columnCount)

let columns = []
byteIndex = 512
for(var i = 0; i < columnCount; i++){
    let tempCol = {
        index: concatBytes(byteIndex, bytes.WORD),
        name_length: concatBytes(byteIndex + 2, bytes.BYTE),
        type: concatBytes(byteIndex + 164, bytes.DWORD),

    }
    tempCol["data_length"] = concatBytes(byteIndex + 169, bytes.BYTE)
    tempCol["name"] = concatBytes(byteIndex + 3, tempCol.name_length, bytes.AS_STRING)
    
    columns.push(tempCol)
    byteIndex += 768
}
byteIndex = next01Index(byteIndex)
console.table(columns)
let rows = []
console.log(byteIndex)
let hexes = []
let rowCount = 0
while(byteIndex < buffer.length){
    
    let sanityBit = buffer[byteIndex]
    rowCount++;
    console.log(sanityBit, rowCount)
    if(rowCount !== sanityBit){
        debugger
    }
    
    tempByteIndex = byteIndex + 25
    let tempRow = {}
    for(var x = 0; x < columns.length; x++){
        let isInt = columns[x].type !== 2621441
        let dataConcat = concatBytes(tempByteIndex, columns[x].data_length, isInt)
        let hex = sliceBuffer(tempByteIndex, columns[x].data_length)
        tempRow[columns[x].name] = {
            offset: tempByteIndex,
            dataConcat: dataConcat,
            hex: hex
        }
        //if(columns[x].name == 'Salary')
            //hexes.push({hex: hex, jobName: tempRow['JobName'].dataConcat})
        if(!isInt){
            tempRow[columns[x].name].dataConcat = dataConcat.substr(0, dataConcat.indexOf('\x00'))
        }
        
        tempByteIndex += columns[x].data_length + 1;
    }
    /*
    let jobName = concatBytes(tempByteIndex += 31, 41, bytes.AS_STRING)

    let tempRow = {
        index: concatBytes(tempByteIndex, bytes.WORD),
        jobName: jobName.substr(0, jobName.indexOf('\x00'))
    }
    //tempRow.name = concatBytes(tempByteIndex += bytes.BYTE, tempCol.length, bytes.AS_STRING)
    */
    rows.push(tempRow)
    byteIndex = tempByteIndex
    byteIndex = nextIndex(byteIndex)
    
}
let output = ''
for(var i = 0; i < hexes.length; i++){
    output += hexes[i].hex + ": " + hexes[i].jobName + "\n"
}
//fs.writeFileSync('hexes.txt', output)
fs.writeFileSync('rows.json', JSON.stringify(rows))
console.table(rows)