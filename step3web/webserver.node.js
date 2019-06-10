//-------------bugbug todo list------------
 
//file is too easy to erase..need to have something to copy the db off somewhere periodically for safety.

//get away from thresholdcount=1

//get away from all one user

//actual leaf
//sub bullet isLeaf
//bullet splitoff via kingword
// bullet split  <<<<   you are here, working UP this list (silent stop on submit to this file)
// kingWordGame  (this was mostly working but hit the bullet split empty issue above, trying to catch it on write.


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

function hasAll(item,cols) {
    for (var col of cols) {
	if (!item.hasOwnProperty(col)) return false;
    }
    return true;
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


/*function validate(val,label,reg){
    if (val.match(reg)) return;
    throw new Error("cannot validate "+label+"   "+reg);
}*/

var urlEncodedParser = bodyParser.urlencoded({ extended:true });


//when you are turning back in a unit of work ("assignment")
async function putAssignment(req,res,next) {
    var assignmentId=""+req.params.assignmentid;
    if (assignmentId != ""+req.body.assignmentid) {
	assert(false,"err1834: params:"+JSON.stringify(req.params)+"!!!body:"+JSON.stringify(req.body)  );
	res.status(500).end("badly formed response");
	return;
    }

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
	//return;  //bugbug later reinstate??, for now we probably want to re-insure the 
    }
    
    res.status(200).end("bugbug plus 10 points for gryffindor");  //bugbug did this make it back...tell client to look for another assignment

    //setImmediate(  ()=>{ buildNewProblems(assignmentId) }  );
    //bugbug moved to main thread
    //bugbug restore this   setInterval(  ()=>{ periodicJobs() } ,  60*SECONDS  );
    return;
}




async function periodicJobs(){
    //bugbug TRYING the await on these
    await resultsBecomeAnswers();
    await answersBecomeSmallerProblems();
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
	show("no rows for resultsBecomeAnswers");
	return;
    }
    for (var ii=0; ii<rows.length; ii++) {
	var row = rows[ii];
	//show("writing answer loc0026m..ii",ii);
	await db.runAsync(
	    " update problem set answer=$1 where problemid=$2   ",
	    [            row["result"],    row["problemid"]   ]
	);
    }

}


function verifyProblemList(problems) {  //bugbug improve. should fill the range given by parent.
    var start = 0;
    var end = 0;
    for(var ii in problems) {
	var pd = problems[ii].problemdata;
	var newstart = pd.start;
	var newend = pd.end;
	show("start,end,newstart,newend",[start,end,newstart,newend]);
	assert(start==0 || newstart == end, "vpl0107bugbug"+JSON.stringify(problems));
	end = newend;
	start = newstart;
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


    for(var ii in workItems) {
	var item=workItems[ii];
	assert(item.popid,"err0050u"+JSON.stringify(item));
	show("parentItem",item);
	debugger;
	assert(item.gameid,'err0336i'+JSON.stringify(item));	
	var newProblems = spawn(item);
	show("about to vpl");
	verifyProblemList(newProblems);
	//insert the new problem objects
	for(var kk in newProblems) { 
	    var kid=newProblems[kk];
	    verifyProblemBeforeWrite(kid,item);
	    //flatten for DB   //bugbug should proj absorb object stringification?
	    kid.problemdata=JSON.stringify(kid.problemdata);  

	    const colsString = "gameid,hashid,problemdata,parentid";
	    const cols=colsString.split(',');
	    const sqlProbInsert = "insert into problem ("+colsString+") values (?,?,?,?)";
	    var columnVals = sqa.proj(kid,cols); // "project out" the column V V -values we need from the kid 
	    db.runAsync(sqlProbInsert,columnVals);  //[kid.gameid, kid.hashid, kid.problem1data, kid.parentid]
	}
    }
    //bugbug return something???
}

function verifyProblemBeforeWrite(kid,parent) {
    //stop("bugbug0209g");
    assert(kid.problemdata.start!=kid.problemdata.end,"bugbug0135h"+JSON.stringify(parent));
    
    //bugbug0135h{"gameid":5,"hashid":".2cun-ounjc","problemdata":{"start":0,"end":"0"},"parentid":116}
}


const requiredCols='answer,problemdata,hashid,popid,gamename'.split(",");
function spawn(item) {  //returns new problems to insert
    item.problemdata=JSON.parse(item.problemdata);
    item.answer = JSON.parse(item.answer);

    assert( hasAll(item,requiredCols),  'bugbug2083j:'+JSON.stringify(item)  );
    show("done 2083,item",item);
    //----a big dispatch ------
    
    //based first on overriding conditions found that are for many games
    if (item.answer.action=='HUH')	return adminGameSpawn(item);
    if (item.answer.action=='COMPLEX')  return adminGameSpawn(item);

    //then based on which game WAS played (parent)
    switch(item.gamename) { 
    case 'isleaf':               return isLeafGameSpawn(item);
    case 'kingword':             return kingWordSpawn(item);
    case 'split': /*fallthru*/   //toplevel is actually split...consolidate? subclass?
    case 'toplevel':             return splitGameSpawn(item);   
    case 'topic':                return topicGameSpawn(item);
    default:
	console.log("game with no subgames yet.."+item.gamename);
	process.exit(41);
    }
}

function topicGameSpawn(item) {

    switch(item.answer.action) {
    case 'CONDITION':
	assert(false,"bugbug0031b",item);  //bugbug you are here...probably check this much in??
    default:
	assert(false,"bugbug0031c",item);
    }
    stop("0032x");

}


//bugbug insure admin game doesn't show a "HUH" button to avoid a slow infi loop
function adminGameSpawn(parent) {
    return [{
	gameid: games['admin'].gameid,
	hashid: parent.hashid,
	problemdata: {start: parent.problemdata.start, end:parent.problemdata.end},
	parentid: parent.popid	    
    }];
}

function isLeafGameSpawn(parent) {
    //these had to double encode to go into sql...fix'em  bugbug??
    //parent.problemdata=JSON.parse(parent.problemdata);
    //parent.result/answer = JSON.parse(parent.answer);

    switch(parent.answer.action) {
	//bugbug should handle HUH 3 levels up???
    case 'KING': //return is array of only one child problem.  
	return [{
	    gameid: games['kingword'].gameid,
	    hashid:parent.hashid,
	    problemdata: parent.problemdata,
	    parentid: parent.popid	    
	}];
    case 'SPLITTABLE':
	return [{
	    gameid: games['split'].gameid,
	    hashid:parent.hashid,
	    problemdata: parent.problemdata,
	    parentid: parent.popid
	}];
    case 'LEAF':
	return [{
	    gameid: games['topic'].gameid,
	    hashid:parent.hashid,
	    problemdata:parent.problemdata,
	    parentid: parent.popid
	}];
    default:
	show('bugbug1429i...parent was',parent);
	process.exit(47);
    }


    /*    var prob1 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.problemdata.start,
	    end: parent.answer.start
	},
	parentid: parent.popid
    };
    show("prob1",prob1);
    //gameid , hashid,    problemdata,    parentid    <----- req'd fields to proceed    
    var prob2 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: parent.answer.end,
	    end: parent.problemdata.end
	},
	parentid: parent.popid
    };

    assert(prob2.gameid,'err0023r'+JSON.stringify(isLeafGame));

    return [prob1,prob2]; */
    assert(false,"bugbug394x");
    process.exit(43);
}

function int(x) {
    return parseInt(x);
}


function kingWordSpawn(parent) {
    var splitGame=games['split'];
    var semanticNullGame=games['semanticnull'];
    assert(splitGame && semanticNullGame,'bugbug2052h bad games table??');
    //'answer,problemdata,hashid,popid,gamename'
    var prob1={
	gameid: semanticNullGame.gameid,
	hashid:parent.hashid,  //bugbug move repetitive fields into a create method? or caller? or both??
	problemdata:{ //bugbug did this new prob1 work?
	    start: int(parent.problemdata.start),
	    end: int(parent.problemdata.start) + int(parent.answer.start) 
	    //bugbug you actually need 3 regions, two can be semantic null, but WHICH two?  probably the first two
	},
	parentid: parent.popid
    };
    var prob2={
	gameid: semanticNullGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: int(parent.problemdata.start) + int(parent.answer.start),
	    end: int(parent.problemdata.start) + int(parent.answer.end)
	},
	parentid:parent.popid	    
    };
    var prob3={  //this is probably the list itself...the only child of interest going forward
	gameid: splitGame.gameid,
	hashid:parent.hashid,
	problemdata: {  //bugbug ints move up....all the way to the data model !??
	    start: int(parent.problemdata.start) + int(parent.answer.end),
	    end: int(parent.problemdata.end),
	    inside: parent.answer.actionCode
	},
	parentid: parent.popid	
    };

    if (prob1.problemdata.start==prob1.problemdata.end) //if the kingwords start the section under study..
	return [prob2,prob3];  //then only 1 semanticnull instead of 2.
    else
	return [prob1,prob2,prob3];
}

function isNumeric(x) {
    return !isNaN(parseFloat(x)) && isFinite(x);
}

function splitGameSpawn(parent) { 
    var isLeafGame=games['isleaf']; 
    assert(isLeafGame,'leafGame2353'+JSON.stringify(games));
    assert(isNumeric(parent.problemdata.start));
    assert(isNumeric(parent.answer.start));
    //every answer generates two new questions (problems)
    //bugbug for now ignoring the 3 result case, where user didn't pick a point but a range.
    //need to add it back in for "completeness" (checking the final result didn't skip stuff)
    //to fix probably need to do it in the game itself, and in the answer-checker, NOT HERE
    assert(parent.answer.start==parent.answer.end,"bugbug2128t");
    var prob1 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: int(parent.problemdata.start),
	    end: int(parent.problemdata.start)+int(parent.answer.start)
	},
	parentid: parent.popid
    };
    //gameid , hashid,    problemdata,    parentid    <----- req'd fields to proceed    
    var prob2 = {
	gameid: isLeafGame.gameid,
	hashid:parent.hashid,
	problemdata: {
	    start: int(parent.problemdata.start)+int(parent.answer.end),
	    end: int(parent.problemdata.end)
	},
	parentid: parent.popid
    };

    assert(prob2.gameid,'err0023r'+JSON.stringify(isLeafGame));

    return [prob1,prob2];
}

	

//from post
async function doNewAssignment(req,res,next) {

    var playerId = req.body.playerId;
    if (playerId==null)
	throw("bad player id body..."+JSON.stringify(req.body));
    //first try to get current unworked assignment (they must hit "huh" or similar to skip it if unworkable)
    // then if result is exactly 1 send that row back

    var apiCount=0;
    while(apiCount<=2) {
	apiCount++;
	
	var sql1 = "select * from myAssignment where playerid=$1 and resultat is null";
	var params1 = [ playerId ];
	var rows = await db.allAsync(sql1, params1);   
	assert(rows,"rows");

	switch(rows.length) {
	case 1:
	    await sendOldAssignment(rows[0],req,res,next); 
	    return; //DONE!   <-----------------NORMAL exit is here  <-----------------
	case 0:
	    await createNewAssignment(req,res,next);
	    continue;  //try again
	default:
	    throw("err6120k: multiple assignments per use??:"+rows.length);
	}
    }
    throw("err0116z:apiCount>2");
};


async function createNewAssignment(req,res,next){

    var playerId=req.body.playerId;
    if (playerId==null)
	throw("err1171x:bad player id");
    var sentIp = getIp(req);

    //get a problemid that is unassigned,assign it to user, and return that row
    var sql0=
	`
    select problem.problemId,problem.answer,assignment.playerId
    from problem  left join  assignment  on  assignment.problemId=problem.problemId
    inner join game on game.gameId=problem.gameId
    inner join playergame on game.gameId=playergame.gameId
    inner join player on player.playerId=playergame.playerId
    where problem.answer is null
    and assignment.problemId is null
    and player.playerId=$1
    order by random()
    limit 1;
    `;

    
    var goodProblemId = null;
    try {
	var sqlRes = await db.getAsync(sql0,[playerId]);
	if (sqlRes==null) {
	    console.log("pnt1437u--no more problems");
	    res.status(204).end("err1440x-no more problems right now");
	    return;
	}
	goodProblemId = sqlRes.problemid;
    } catch(ex) {
	console.log("bugbug1110s:"+ex);
	return;
    };
    assert(goodProblemId>0,"err1218c,goodProblemId="+JSON.stringify(goodProblemId));
    
    var sql1=""+
	"insert into assignment ( playerid, problemId,   sentat, sentip     )"+
	"     values            ( $1      , $2,      datetime(), $3         );"+
        ""; 
    var params1 = [              playerId,goodProblemId,/*fromSql,*/  sentIp   ];
    var code=await db.runAsync( sql1, params1 )
    assert(!code,"err9731w--insert complete"+code);
}


async function sendOldAssignment(result,req,res,next){
    //console.log("sendold bugbug result="+JSON.stringify(result));
    const mimeType = 'text/javascript';
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
    assert(games,'err0120v:no games');
    gamesById = await db.domainAsync(sql, [], "gameid");
    

    
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

    setImmediate( ()=>{
	periodicJobs();
    });


}
main();

