
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

const SECONDS=1000;




//based on earlier work for ayvex rpg discussion board
//copyright 2019 Ayvex Light Industries LLC and CancerFool Inc. 

function assert(testCond, label) {
    if (testCond) return;
    console.log("assert fail:"+label);
    throw("assert fail:"+label);
}

function show(x,y,z) {
    var str=x+'='+JSON.stringify(y)+"-"+z
    console.log(str);
}


const dbx = new sqlite.Database('../halite.db');
const db = sqa.promote(dbx);

//domain data from DB
var games=null;

function fileExist(p) {
    return fs.existsSync(p);
}

function fileDelete(p) {
    return fs.unlinkSync(p);
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
    
    res.status(200).end("bugbug plus 10 points for gryffindor");  //bugbug did this make it back...tell client to look for another assignment

    //setImmediate(  ()=>{ buildNewProblems(assignmentId) }  );
    //bugbug moved to main thread
    //bugbug restore this   setInterval(  ()=>{ periodicJobs() } ,  60*SECONDS  );
    return;
}




async function periodicJobs(){
    //bugbug need to await these??
    resultsBecomeAnswers();
    answersBecomeSmallerProblems();
    console.log("done with periodic");
}


var answerCountThreshold = 1;  //bugbug should be 5
async function resultsBecomeAnswers() {
    var rows=
	await db.allAsync(
	    "  select pp.problemId, count(1) as c, aa.result    "+
		"  from problem pp inner join assignment aa   "+
		"  on aa.problemId=pp.problemId    "+
		"  where aa.result is not null and"+
		"      pp.answer is null   "+
		"  group by  pp.problemId,aa.result   "+
		"  having c >= $1  "+
		"  order by pp.problemId ASC, aa.result ASC     "+
		"  ;  ",
	    [answerCountThreshold]
	);

    if (!rows || rows.length<1){
	show("no rows for results to answers");
	return;
    }
    for (var ii=0; ii<rows.length; ii++) {
	var row = rows[ii];
	show("ii",ii);
	await db.runAsync(
	    " update problem set answer=$1 where problemid=$2   ",
	    [            row["result"],    row["problemid"]   ]
	);
    }

}





//make new problems out of new answer !!!  problems make assignments, assignments make problems
//base new problems on old one.
async function answersBecomeSmallerProblems() {
    var workItems = await db.allAsync(
	`
	select  par.problemid as popid, kid.parentid, kid.problemid as kidid,
	par.hashid,  par.problemdata,  par.answer,  par.gameid as gameid,  gg.gamename as gamename
	from      problem par
	inner join game gg
	on        par.gameid=gg.gameid
	left join problem kid
	on        par.problemid=kid.parentid
	where par.answer is not null
	group by popid,kidid
	having kidid is null;
	`,[]
    );
    assert(workItems,'workitems');
    if (workItems.length==0){
	console.log("no workitems");
	return;
    }

    const colsString = "gameid,hashid,problemdata,parentid";
    const cols=colsString.split(',');
    const sqlProbInsert = "insert into problem ("+colsString+") values (?,?,?,?)";
    for(var ii in workItems) {
	var item=workItems[ii];
	assert(item.popid,"err0050u"+JSON.stringify(item));
	show("parentItem",item);
	assert(item.gameid,'err0336i'+JSON.stringify(item));  //bugbug failing here you are here

	var newProblems = spawn(item);  
	//insert the new problem objects
	for(var kk in newProblems) { //bugbug OF instead of IN ??
	    var kid=newProblems[kk]; //show("bugbug2237kid",kid);
	    //flatten for DB   //bugbug should proj absorb object stringification?
	    kid.problemdata=JSON.stringify(kid.problemdata);  
	    var columnVals = sqa.proj(kid,cols); // "project out" the column V V -values we need from the kid 
	    db.runAsync(sqlProbInsert,columnVals);  //[kid.gameid, kid.hashid, kid.problem1data, kid.parentid]
	}
    }
    //bugbug return something???
}

function spawn(item) {
    assert(item.gamename,JSON.stringify(item));
    //gamesById[item.gameid].spawn(item);
    switch(item.gamename) {  //toplevel,isleaf,kingword,test
    case 'leafgame':     return isLeafGame(item);
    case 'kingWord':     return kingWordSpawn(item);
    case 'split': /*fallthru*/   //toplevel is actually split...consolidate? subclass?
    case 'toplevel':     return splitGameSpawn(item);   
	
    default:             throw("game with no subgames yet.."+item.gamename);
    }
}


function splitGameSpawn(parent) { //of some game bugbugd
    show("bugbug2213 parent",parent,parent);
    assert(parent.gamename,'gamename2351');
    assert(parent.gameid,'gameid23jj');
    
    //these had to double encode to go into sql...fix'em
    parent.problemdata=JSON.parse(parent.problemdata);
    parent.result = JSON.parse(parent.answer);

    assert(parent.result);
    assert(parent.problemdata);
    assert(parent.hashid);
    assert(parent.popid,"no popid"+JSON.stringify(parent));
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
    //"toplevel":{"gameId":1,"gameName":"toplevel","n":1,"m":1},"isleaf":{"gameId":2,"gameName":"isleaf","n":1,"m":1},"kingword":{"gameId":3,"gameName":"kingword","n":1,"m":1},"test":{"gameId":4444,"gameName":"test","n":1,"m":1}}
    var isLeafGame=games['isleaf']; //bugbug some lookup or enum??
    assert(isLeafGame,'leafGame2353'+JSON.stringify(games));
    //every answer generates two new questions (problems)
    var prob1 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.problemdata.start,
	    end: parent.result.start
	},
	parentid: parent.popid
    };
    
    var prob2 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.result.end,
	    end: parent.problemdata.end
	},
	parentid: parent.popid
    };

    assert(prob2.gameid,'bugbug0023'+JSON.stringify(isLeafGame));
    /*gameid integer references game,
    hashid varchar(20) not null,
    problemdata varchar(4000),
    parentid integer references problem,  --selfref is root indicator
    */

    return [prob1,prob2];
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

function sendOldAssignment(result,req,res,next){
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




async function main() {
    var sql = "select gameid,gamename,n,m from game;"  //specifying columns lowercase for json customers
    //global games //
    games = await db.domainAsync(sql, [], "gamename");
    assert(games,'err:no games');
    gamesById = await db.domainAsync(sql, [], "gameid");
    //bugbug just put this here ... did it run???
    //bugbug there can be only one var for games to avoid the where to put the methods problem
    

    
    //---------- main app---------------
    var app = express();
    app.use(morgan('combined'));  //or 'tiny'
    app.use(vhost('hal.localhost', halApp));

    //app.use(vhost('localhost', badHostApp));
    //app.use(vhost('*.localhost', badHostApp));

    app.listen(3001);
    console.log("started");

    
    setInterval( ()=>{

	//const goFile="../go";
	//if (!fileExist(goFile)) return;
	//fileDelete(goFile);

	periodicJobs();
    }, 15*SECONDS  );
    //DONE



}
main();
//bugbug did we get this far you are here
