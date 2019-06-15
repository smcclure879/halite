//my hackery to get the data into files and my db.
//build it better to get all the crits...this is just to get my sample subset converted into halite

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');





const fileToRead = "lessThan3.dataset";
const readInterface = readline.createInterface({
    input: fs.createReadStream(fileToRead),
    output: null,
    console: false
});



var db = new sqlite3.Database('../halite.db');
function addTopLevelProblemToDb(hash,nct,src1,src2,cb) {
    var problemData = JSON.stringify({nct:nct});
    var sql = `insert into
    problem (gameId,hashId,extraproblem,prstart,prend     )
    values  ( 1,     $1,     $2,         0,      -1       )   
    `;//gameId=1 is toplevel, end is determined later and is -1 for now

    var params = [ hash, problemData ]; 
    db.run(sql, params, function(err){
	if (err)
	    console.log('***sql error:'+err);
	else
	    console.log('ok.'+hash);
    });

    cb();

}


function mkDirByPathSync(dir) {
    const sep = path.sep;
    const initDir = '';
    //const baseDir = __dirname;

    //console.log(dir);
    
    return dir.split(sep).reduce((parentDir, childDir) => {
	const curDir = path.resolve(parentDir, childDir);
	try {
	    //console.log("curDir="+curDir);
	    fs.mkdirSync(curDir);
	} catch (err) {
	    if (err.code === 'EEXIST') { // curDir already exists!
		return curDir;
	    }

	    // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
	    if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
		throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
	    }

	    const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
	    if (!caughtErr || caughtErr && curDir === path.resolve(dir)) {
		throw err; // Throw if it's just the last created dir.
	    }
	}

	return curDir;
    }, initDir);
}




var count=0;
function SingleSyncWriter() {
    this.handle=null;  //always start uninitialized
    this.forceDir=function(dir) {
	//console.log("forcing:"+dir);
	mkDirByPathSync(dir);
	//fs.mkdirSync(dir,{recursive:true});
	//fs.ensureDirSync(dir);
    };
    this.open = function(dir,file) {
	var fullPath=dir+"/"+file;
	this.close();
	this.handle=null;
	this.forceDir(dir);
	var fd=fs.openSync(fullPath,'w');
	if (!fd)
	    throw "err2107w";
	this.handle=fd;
    };
    this.close=function(){
	if (!this.handle) return;
	fs.closeSync(this.handle);
	this.handle=null;
    };
    this.write=function(str){
	if (this.handle) {
	    //this.handle.writeSync(str,otherStuffHere);
	    fs.writeSync(this.handle, str, null, 'utf-8');
	} else {
	    console.log("err1522v:noHandle:"+str);
	}
    }
}


var fhw=new SingleSyncWriter();
const newItemMatch = /(\.(\w)(\w)(\w)(\w)-\w{5})\|(NCT\d+)\|(\w+)\|(\w+)/g ;    
readInterface.on('line', function(line) {
    ++count;
    if (count %100==0) console.log(count);

    var matches = newItemMatch.exec(line);
    if (matches) {
	matches = Array.from( matches );
	var hash = matches[1];
	var fileName = hash.substr(1)+".crit";
	
	var dir="../crits/"+matches[2]+"/"+matches[3]+"/"+matches[4]+"/"+matches[5];
	var nct= matches[6];
	var fullPath=dir+"/"+fileName;
	fhw.open(dir,fileName);//synchronous, autocloses previous
	addTopLevelProblemToDb(hash,nct,matches[7],matches[8],function(){console.log('done');});
	//#line was like   [whitespace].2cun-ounjc|NCT01666808|orig|hashInsert.py|	
    } else {
	fhw.write(line);
	fhw.write('\n');
    }
});


readInterface.on('close',function() {
    fhw.close();
    console.log("closed");
});
		 

