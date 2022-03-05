var fs = require('fs');

const filePath = 'jobs.dat'
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
let rowCount = concatBytes(byteIndex, bytes.LONG)
let columnCount = concatBytes(byteIndex += 47, bytes.WORD)
console.log(rowCount, columnCount)

let columns = []
byteIndex = 512
for(var i = 0; i < columnCount; i++){
    tempByteIndex = byteIndex
    let tempCol = {
        index: concatBytes(tempByteIndex, bytes.WORD),
        length: concatBytes(tempByteIndex += bytes.WORD, bytes.BYTE)
    }
    tempCol.name = concatBytes(tempByteIndex += bytes.BYTE, tempCol.length, bytes.AS_STRING)
    columns.push(tempCol)
    byteIndex += 768
}
console.table(columns)