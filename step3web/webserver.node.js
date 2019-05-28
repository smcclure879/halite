
//bugbug need to have something to copy the db off somewhere periodically for safety.
//file is too easy to erase..


const express = require('express');
const vhost = require('vhost');  //sorting on domain name virtual host
const morgan = require('morgan'); //logging
const bodyParser = require("body-parser");
const path = require('path');
const util = require('util')
const htmlEncode = require('htmlencode').htmlEncode;
const fs = require('fs');
const sqlite = require('sqlite3');
const sqa = require('./sqliteAsync.js');





//based on earlier work for ayvex rpg discussion board
//copyright 2019 Ayvex Light Industries LLC and CancerFool Inc. 

const assert = (testCond, label) => {
    if (testCond) return;
    throw new Error(label);
};

const dbx = new sqlite.Database('../halite.db');
const db = sqa.promote(dbx);


function fileExist(p) {
    return fs.existsSync(p);
}

function serveStaticAbs(res,absPath,mimeType) {
    console.log("serveStaticAbs:"+absPath);
    if (!fileExist(absPath))
	res.status(404).end('error:'+ex);
    mimeType=mimeType || 'text/plain';
    res.setHeader('Content-Type', mimeType);
    res.sendFile(absPath);
    console.log("ssa2:"+absPath);
}

function last(x) {  //x is array
    return x[x.length-1];
}

function getExtension(fileName) {
    var parts=fileName.split('.');
    return last(parts);
}

function typeFromExtension(fileName) {
    var ext=getExtension(fileName);
    switch(ext) {
    case 'js':  	return  'text/javascript';
    case 'htm':
    case 'html':        return  'text/html';
    case 'ico':         return  'image/vnd.microsoft.icon';
    }

    return 'x/x-unknown';
}


function getIp(req){
    return req.headers['x-forwarded-for'] ||
	req.connection.remoteAddress ||
	req.socket.remoteAddress ||
	(req.connection.socket ? req.connection.socket.remoteAddress : null);
}


function serveIconFile(req,res,next){
    var sought = "favicon.ico";
    var absPath=path.join(__dirname,"../statics",sought);
    var mimeType = typeFromExtension(sought);
    serveStaticAbs(res,absPath,mimeType);
}


function validate(val,label,reg){
    if (val.match(reg)) return;
    throw new Error("cannot validate "+label+"   "+reg);
}

var urlEncodedParser = bodyParser.urlencoded({ extended:true });


//when you are turning back in a unit of work ("assignment")
async function putAssignment(req,res,next) {
    var assignmentId=""+req.params.assignmentid;
    if (assignmentId != ""+req.body.assignmentid)
	throw("err1834: params:"+JSON.stringify(req.params)+"!!!body:"+JSON.stringify(req.body));

    var userAnswer=JSON.stringify(req.body);
    
    // write the user answer back to db.
    await db.runAsync(
	"update assignment set resultat=datetime(), resultIp=$1, result=$2   "+
	    "where    assignmentId=$3   and resultAt is null;          ",

	[                          /*sql,*/        getIp(req),   userAnswer,
	    /*      */     assignmentId ]
    );

    var rowsChanged = await db.getScalarAsync("  select changes();  ", [], "changes()");
    if (rowsChanged!=1) {
	console.log("err1752t: rc="+rowsChanged);
	//return;  //bugbug later reinstate, for now we probably want to re-insure the 
    }
    
    res.status(200).end("plus 10 points for gryffindor");  //bugbug did this make it back...tell client to look for another assignment

    setImmediate(  ()=>{ buildNewProblems(assignmentId) }  );
    return;
}



//make new problems out of new answer !!!  problems make assignments, assignments make problems
//base new problems on old one.
async function buildNewProblems(assignmentId) {
    var parent = await db.getAsync(
	"    select * from assignment aa       "+
	    "    inner join problem pp         "+
	    "    on aa.problemid=pp.problemid  "+
	    "    where assignmentId=$1;        ",
	[              assignmentId            ] 
    );
    
    //these had to double encode to go into sql...fix'em
    parent.problemdata=JSON.parse(parent.problemdata);
    parent.result = JSON.parse(parent.result);
    
/*    parent={
	"assignmentid":30,"problemid":4,
	"playerid":42,"sentat":"2019-05-27 05:40:46","sentip":"::1",
	"resultat":"2019-05-27 05:40:49","resultip":"::1",
	"result":"{\"assignmentId\":\"30\",\"start\":\"6393\",\"end\":\"6393\",\"action\":\"AND\"}",
	"gameid":1,"hashid":".2jw5-ujimg",
	"problemdata":"{\"nct\":\"NCT02649439\",\"start\":0,\"end\":-1}","parentid":null}
  bugbug update3 is showing:
{"assignmentId":"16","start":"228","end":"228","action":"AND"}
 probRow=
{"problemid":4,"gameid":1,"hashid":".2jw5-ujimg","problemdata":"{\"nct\":\"NCT02649439\",\"start\":0,\"end\":-1}","parentid":null}
*/
    
    const colsString = "gameid,hashid,problemdata,parentid";
    const cols=colsString.split(',');
    const sql = "insert into problem ("+colsString+") values (?,?,?,?)";
    
    var leafGameId = 2; //bugbug some lookup or enum??    
    //every answer generates two new questions (problems)
    var prob1 = {
	gameid: leafGameId,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.problemdata.start,
	    end: parent.result.start
	},
	parentid: parent.problemid,
    };
    
    var prob2 = {
	gameid: leafGameId,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.result.end,
	    end: parent.problemdata.end
	},
	parentid: parent.problemid,
    };

    /*gameid integer references game,
    hashid varchar(20) not null,
    problemdata varchar(4000),
    parentid integer references problem,  --selfref is root indicator
    */

    prob1.problemdata = JSON.stringify(prob1.problemdata);
    prob2.problemdata = JSON.stringify(prob2.problemdata);
    
    var p1=sqa.proj(prob1,cols);
    var p2=sqa.proj(prob2,cols)
    db.runAsync(sql,p1);
    db.runAsync(sql,p2);
}


var doNewAssignment=function(req,res,next /*,resultJustInserted*/ ) {
    req.apiCount=req.apiCount || 0;
    req.apiCount++;
    if (req.apiCount>2)
	throw("req.apiCount>2");
    var playerId = req.body.playerId;
    if (playerId==null)
	throw("bad player id body..."+JSON.stringify(req.body));
    //first try to get current unworked assignment (they must hit "huh" or similar to skip it if unworkable)
    // then if result is exactly 1 send that row back
    
    var sql1 = "select * from myAssignment where playerid=$1 and resultat is null";
    var params1 = [ playerId ];

    var statement = db.prepare(sql1);

    return db.all( sql1, params1, function(err,rows){
	if (err!=null)
	    throw("err0232i"+JSON.stringify(err));
	if (rows.length==0)
	    //if (resultJustInserted)
	    //    throw("err2124j:insertedRowNotFound");
	
	    return createNewAssignment(req,res,next);
	if (rows.length>1)
	    throw("bugbug multiple assignments per use??");

	//so...exactly 1 result, send it back intead
	return sendOldAssignment(rows[0],req,res,next);
    });
};

//bugbug need to retest this
var createNewAssignment=function(req,res,next){
    //who is sending it??
    var playerId=req.body.playerId;
    if (playerId==null)
	throw("bad player id");
    var sentIp = getIp(req);

    //get a problemid that is unassigned,assign it to user, and return that row
    //bugbug should be from a query 
    var goodProblemId = 4;  


    var sql1=""+
	"insert into assignment ( playerid, problemId,   sentat, sentip     )"+
	"     values            ( $1      , $2,      datetime(), $3         );"+
        ""; //needed?? bugbug "select last_insert_rowid();"  ;


    var params1 = [              playerId,goodProblemId,/*fromSql,*/  sentIp   ];
    return db.run( sql1, params1, function(errObj){
	//not yet...just run thru again...
	//bugbug need infi loop detect here !
	//sendOldAssignment(newResult,req,res,next);  //newResult is now "old" ?? is this correct bugbug verf
	//console.log("db.run after insert newResult="+newResult);
	if (errObj)
	    throw("error on insert assignment: "+JSON.stringify(errObj));

	doNewAssignment(req,res,next);  //   RECURSES HERE

    });
}

var sendOldAssignment=function(result,req,res,next){
    console.log("sendold bugbug result="+JSON.stringify(result));
    var mimeType = 'text/javascript';
    res.setHeader('Content-Type', mimeType);
    res.end(JSON.stringify(result));
}



				    
var badHostApp = express();
badHostApp.use(function(req,res,next){
    console.log("err2033i: badhost:"+util.inspect(req.vhost));
    res.status(503).send();
});



function quip(res,x) {
    res.setHeader('Content-Type', 'text/plain');
    res.end('quip....  '+x);
}


//for debugging...
var stupidMiddleware = function(req,res,next) {
    console.log("stupid"+JSON.stringify(req.params));
    next();
}


//halite API
var halApi = express(); 
halApi.use(urlEncodedParser);
//POST Create 201 (Created), 'Location' header with link to /customers/{id} containing new ID.
//create, no id given. nothing really. gives back whole row
halApi.post('/', doNewAssignment);
//save it back after
halApi.put('/:assignmentid', putAssignment);


//just halite
var halApp = express();
halApp.use('/favicon.ico', serveIconFile);
halApp.use('/statics', express.static('../statics')); 
halApp.use('/crits',express.static('../crits'));
halApp.use("/assignment/", halApi);


//---------- main app---------------
var app = express();
app.use(morgan('combined'));  //or 'tiny'
app.use(vhost('hal.localhost', halApp));

//app.use(vhost('localhost', badHostApp));
//app.use(vhost('*.localhost', badHostApp));

app.listen(3001);
console.log("started");
//DONE


