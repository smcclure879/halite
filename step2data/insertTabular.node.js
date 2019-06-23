

const path = require('path');
const util = require('util')
const fs = require('fs');
const sqlite = require('sqlite3');
const sqa = require('../libs/sqliteAsync.js');
const readline = require('readline');




//based on earlier work for ayvex rpg discussion board
//copyright 2019 Ayvex Light Industries LLC and CancerFool Inc. 

function assert(testCond, label) {
    if (testCond) return;
    console.log(" !!! ---> assert fail:"+label);
    //throw("assert fail:"+label);
    process.exit(88);
}

function stop(label,val) {
    console.log(" !!!!!!   STOP   ="+label+"--"+JSON.stringify(val));
    process.exit(89);
}

function show(x,y,z) {
    var str=x+'='+JSON.stringify(y)+"-"+z
    console.log(str);
}
/*
function hasAllOrDie(item,cols,label) {
    for (var col of cols) {
	console.log(col);
	if ( !item.hasOwnProperty(col) ){
	    stop( (label||"bugbug0243b") + col + JSON.stringify(item) );
	    return false;
	}
	if ( !item[col] && !isNumeric(item[col]) ) {
	    stop( (label||"bugbug0244q") + col + JSON.stringify(item) )
	    return false;
	}
    }
    return true;
}
*/

const dbx = new sqlite.Database('../halite.db');
const db = sqa.promote(dbx);


function fileExist(p) {
    return fs.existsSync(p);
}

function fileDelete(p) {
    return fs.unlinkSync(p);
}


function last(x) {  //x is array
    return x[x.length-1];
}

function getExtension(fileName) {
    var parts=fileName.split('.');
    return last(parts);
}



/*function serveIconFile(req,res,next){
    var sought = "favicon.ico";
    var absPath=path.join(__dirname,"../statics",sought);
    var mimeType = typeFromExtension(sought);
    serveStaticAbs(res,absPath,mimeType);
}


}*/



// async function awaitAllMapAsync(items, fn) {
//     for await (const it of items) {
// 	await fn(it);
//     }

// }

async function main(){
    var argv=process.argv;  //forcing to array
    //minus the call to node and this file....
    argv.shift();
    argv.shift();

    var refCount=0;
    await argv.forEach( async function(file) {
	refCount++;
	var readInterface = readline.createInterface({
	    input: fs.createReadStream(file),
	    output: null,
	    console: false
	});
	//run all this code as a block that's differnt each loop
	var domainCode=file.substr(5,file.length-10).toLowerCase();
	if (domainCode=='test') domainCode='medtest';
	var count=0;
	
	console.log("READING "+domainCode);
	readInterface.on('line',async function(line){
	    ++refCount;
	    ++count;
	    
	    if (count %100==0) console.log(domainCode+count+"    "+refCount);
	    
	    if (count==1) return;  //skip first line
	    
	    var fields=line.split('\t');
	    fields.unshift(domainCode);
	    //show("bugbug1146y",fields);
	    
	    var sql = '  insert into dd (dd,token,pres,text) values (?,?,?,?) ;   ';
	    try{
		await db.runAsync(sql,fields);
	    } catch (ex) {
		console.log("bugbug1346c:"+ex);
		console.log(line);
	    }
	    --refCount;
	    console.log(refCount);
	    if (refCount==0)
		process.exit(122);
	});
	readInterface.on('close',async function(){
	    console.log("closing:"+domainCode+refCount);
	    --refCount;
	    if (refCount==0)
		process.exit(81);
	});
    
    });

}


main();

