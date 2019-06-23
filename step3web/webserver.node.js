//-------------bugbug todo list------------
 
//file is too easy to erase..need to have something to copy the db off somewhere periodically for safety.

//get away from thresholdcount=1

//merge isLeaf and various leaf games?

//get away from all one user

//and this "bug"... (unify everything to 3 sub case?, invert tree to have 3 child pointers?)
    //bugbug for now ignoring the 3 result case, where user didn't pick a point but a range.
    //need to add it back in for "completeness" (checking the final result didn't skip stuff)
//to fix probably need to do it in the game itself, and in the answer-checker, NOT HERE

//actual leaf      (uses the actual domain data, but to what extent?  bugbug )
// (using meta domain data from rubenstein  (also code cleanup)   //<<< you are here,working here upward









const express = require('express');
const vhost = require('vhost');  //sorting on domain name virtual host
const morgan = require('morgan'); //logging
const bodyParser = require("body-parser");
const path = require('path');
const util = require('util')
const htmlEncode = require('htmlencode').htmlEncode;
const fs = require('fs');
const sqlite = require('sqlite3');
const sqa = require('../libs/sqliteAsync.js');

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
    var userResult=req.body;
    //!!!bugbug? ---> {"assignmentid":"1","rstart":"454","rend":"454","raction":"JOIN","extraresult":{"utc":"Fri, 14 Jun 2019 22:34:14 
    hasAllOrDie( userResult, ['assignmentid','rstart','rend','raction','extraresult'], "bugbug1001e"+JSON.stringify(userResult)  );
    
    var assignmentId=""+req.params.assignmentid;
    if (assignmentId != ""+req.body.assignmentid) {
	assert(false,"err1834: params:"+JSON.stringify(req.params)+"!!!body:"+JSON.stringify(req.body)  );
	res.status(500).end("badly formed response");
	return;
    }

    assert(userResult.extraresult,"err0115q"+userResult);
    show("userResult.extraresult",userResult.extraresult);
    var extraresult = JSON.stringify(userResult.extraresult);
    show("bugbug2135d",typeof extraresult);
    // write the user answer back to db.
    await db.runAsync(
	`
	update assignment set resultat=datetime(),
	resultIp=?,       extraresult=?,          rstart=?,           rend=? ,     raction=?   where    assignmentId=?   and resultAt is null;
	`,[ getIp(req),   extraresult,    userResult.rstart, userResult.rend, userResult.raction,
	    /* */ assignmentId  //bugbug upgrade to use "proj"
	]
    );
    
    var rowsChanged = await db.getScalarAsync("  select changes();  ", [], "changes()");
    if (rowsChanged!=1) {
	console.log("err1752t: rc="+rowsChanged);
	res.status(500).end('err0908w');
	return;
    }


    res.status(200).end("plus 10 points for gryffindor");  //bugbug did this make it back...tell client to look for another assignment

    //setImmediate(  ()=>{ buildNewProblems(assignmentId) }  );
    //I moved this to main thread
    //bugbug restore this   setInterval(  ()=>{ periodicJobs() } ,  60*SECONDS  );
    return;
}




async function periodicJobs(){
    await resultsBecomeAnswers();
    await answersBecomeSmallerProblems();
    console.log("done with periodic");
}


var answerCountThreshold = 1;  //bugbug should be 5
async function resultsBecomeAnswers() {
    var rows=
	await db.allAsync(
	    `  select pp.problemId, count(1) as c, aa.extraresult as extraresult, aa.rstart, aa.rend, aa.raction   
		  from problem pp inner join assignment aa   
		  on aa.problemId=pp.problemId    
		  where aa.rstart is not null and  
		      pp.anstart is null   
		  group by  pp.problemId,aa.rstart   
		  having c >= ?  
		  order by pp.problemId ASC, aa.rstart ASC     
		  ;  
	    `,
	    [answerCountThreshold]
	);

    if (!rows || rows.length<1){
	show("no rows for resultsBecomeAnswers");
	return;
    }



    //bugbug1209 upgrading to use proj
    var colsStr="extraresult,rstart,rend,raction";
    var colsList=colsStr.split(',');
    
    for (var ii=0; ii<rows.length; ii++) {
	var row = rows[ii];
	hasAllOrDie(row,colsList,'bugbug1226');
	//show("writing answer loc0026m..ii",ii);
	await db.runAsync(  
	    " update problem set extraanswer=?,  anstart=?,    anend=?,   anaction=?      where problemid=? ",
	    [row["extraresult"], row['rstart'],row['rend'],row['raction'],    row["problemid"]     ]
	);
    }

}


function verifyProblemList(problems) {  //bugbug improve. should fill the range given by parent.
    var start = 0;
    var end = 0;
    for(var ii in problems) {
	console.log("vpl ii="+ii);
	var pr = problems[ii];
	var newstart = pr.prstart;
	var newend = pr.prend;
	assert(newend,"vpl0117j"+JSON.stringify(problems));
	show("start,end,newstart,newend",[start,end,newstart,newend]);
/*
	start,end,newstart,newend=[0,0,454,-1]-undefined
	start,end,newstart,newend=[454,-1,454,-1]-undefined
	!!! ---> assert fail:err0107vpl[
	    {"gameid":2,"hashid":".2cun-ounjc","extraproblem":{},"prstart":454,"prend":-1,"parentid":1},
	    {"gameid":2,"hashid":".2cun-ounjc","extraproblem":{},"prstart":454,"prend":-1,"parentid":1}]
*/	
	assert(start==0 || newstart == end, "err0107vpl"+JSON.stringify(problems));
	end = newend;
	start = newstart;
    }
}


//make new problems out of new answer !!!  problems make assignments, assignments make problems
//base new problems on old one.
async function answersBecomeSmallerProblems() {
    var workItems = await db.allAsync(  
	`
	select  par.problemid as popid, kid.parentid, kid.problemid as kidid, par.hashid,
	par.extraproblem, par.prstart, par.prend,
	par.extraanswer, par.anstart, par.anend, par.anaction,
	par.gameid as gameid,  gg.gamename as gamename
	from      problem par
	inner join game gg
	on        par.gameid=gg.gameid
	left join problem kid
	on        par.problemid=kid.parentid
	where par.anstart is not null
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
	assert(item.extraproblem,"err1045p");
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
	    
	    //bugbug needed and if so why??? kid.extraproblem=JSON.stringify(kid.extraproblem);  

	    const colsString = "gameid,hashid,extraproblem,prstart,prend,parentid";
	    const cols=colsString.split(',');
	    const sqlProbInsert = "insert into problem ("+colsString+") values (?,?,?,?,?,?)";
	    var columnVals = sqa.proj(kid,cols); // "project out" the column V V -values we need from the kid 
	    db.runAsync(sqlProbInsert,columnVals);  //[kid.gameid, kid.hashid, kid.problem1data, kid.parentid]
	}
    }
    //no return value required
}

function verifyProblemBeforeWrite(kid,parent) {
    assert(kid.prstart!=kid.prend,"err0135h"+JSON.stringify(parent));
}




const requiredCols='extraanswer,anstart,anend,anaction,extraproblem,prstart,prend,hashid,popid,gamename'.split(",");
function spawn(item) {  //returns new problems to insert
    //----a big dispatch ------
    //!!! ---> assert fail:err2131j:{"popid":1,"parentid":null,"kidid":null,"hashid":".2cun-ounjc","extraproblem":"{\"nct\":\"NCT01666808\"}","prstart":0,"prend":-1,"extraanswer":null,"anstart":454,"anend":454,"anaction":"JOIN","gameid":1,"gamename":"toplevel"}
    
    hasAllOrDie( item, requiredCols, 'err2131j:'+JSON.stringify(item)  );
    show("done 2083k,item",item);
    
    //based first on overriding conditions found that are for many games

    //bugbug should these be checks for gamename???
    //regardless of what game played, these have their own special spawn rules...
    if (item.anaction=='HUH')	return adminGameSpawn(item);
    if (item.anaction=='COMPLEX')  return adminGameSpawn(item);  //bugbug COMPLEX likely same as HUH !!!

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

    assert(item.anend && item.anstart && item.anaction, "err0115t",item);

    switch(item.anaction) {  	//the mapping might now be simple, but won't be in future likely.  we certainly don't want to trust the raction since it's TAINTED data from user.  can't exec on it or anything!!!

    case 'CONDITION':  return singleGame('condition'  ,item);
    case 'DRUG':       return singleGame('drug'       ,item);
    case 'ORGAN':      return singleGame('organ'      ,item);
    case 'RISKFACTOR': return singleGame('riskfactor' ,item);
    case 'SIDEEFFECT': return singleGame('sideeffect' ,item);
    case 'SYMPTOM':    return singleGame('symptom'    ,item);
    case 'TREATMENT':  return singleGame('treatment'  ,item);
    case 'TEST':       return singleGame('medtest'    ,item);

    default:
	assert(false,"bugbug0031c",item);
    }
    stop("bugbug0032x");

}


function singleGame(gameName,parent) {
    return [singleGame0(gameName,parent)];
}


function singleGame0(gameName,parent){
    
    assert(parent.anend && isNumeric(parent.anstart) && parent.anaction,"err0118k",parent);
    assert( games[gameName] , "err0135p"+gameName+JSON.stringify(games));
    return {
	gameid: games[gameName].gameid,
	hashid: parent.hashid,
	extraproblem: JSON.stringify({}),
	prstart: parent.prstart,
	prend: parent.prend, //bring in inherent and/or??? bugbug
	parentid: parent.popid
    };
}

//bugbug insure admin game doesn't show a "HUH" button to avoid a slow infi loop
function adminGameSpawn(parent) {
    return singleGame('admin',parent);
}

function isLeafGameSpawn(parent) {

    switch(parent.anaction) {
	//note: HUH is handled a few levels up
    case 'KING': 	return singleGame('kingword',parent);
    case 'SPLITTABLE':	return singleGame('split',parent);
    case 'LEAF':        return singleGame('topic',parent);  //figure out what kind of leaf!
    default:
	show('bugbug1429i...parent was',parent.anaction);
	process.exit(47);
    }
    stop('should literally never be able to get here');
}

function int(x) {
    return parseInt(x);
}


function kingWordSpawn(parent) {
    
    var baseProblem = singleGame0('split',parent);  //note unmakes the list !

    var prob1=singleGame0('semanticnull',parent);
    //starts inh from parent
    prob1.prend = prob1.prstart + parent.anstart;

    
    //its meaning is subsumed into a wrapper of the list in prob3.
    var prob2=singleGame0('semanticnull',parent);
    prob2.prend =  prob2.prstart + parent.anend;  //out of order bc start needed before mod.
    prob2.prstart += parent.anstart;


    //this is probably the list itself...the only child of interest going forward
    var prob3=singleGame0('split',parent);
    prob3.inside=parent.raction;
    prob3.prstart += parent.anend;
    //prend inh from parent

    if (prob1.rstart==prob1.end) //if the kingwords start the section under study..
	return [prob2,prob3];  //then only 1 semanticnull instead of 2.  no zero-length segments shall be created
    else
	return [prob1,prob2,prob3];
}

function isNumeric(x) {
    return !isNaN(parseFloat(x)) && isFinite(x);
}

function splitGameSpawn(parent) { 
    // var isLeafGame=games['isleaf']; 
    // assert(isLeafGame,'leafGame2353'+JSON.stringify(games));
    // assert(isNumeric(parent.prstart));
    // assert(isNumeric(parent.anstart));
    //every answer generates two new questions (problems)

    assert(parent.anstart==parent.anend,"err2128t");  //bugbug  1. check in again 2. fix this in clientside game rules.
    var prob1 = singleGame0('isleaf',parent);
    prob1.prend = prob1.prstart + parent.anstart;
    //bugbug
    //prob1.prstart  parent.anstart ????
    
    var prob2 = singleGame0('isleaf',parent);
    prob2.prstart += parent.anend;

//    stop("bugbug0102v probs",[prob1,prob2]);
    //!!   STOP   =bugbug0102v probs--[{"gameid":2,"hashid":".2cun-ounjc","extraproblem":"{}","prstart":483,"prend":426,"parentid":27},
    //				     {"gameid":2,"hashid":".2cun-ounjc","extraproblem":"{}","prstart":909,"prend":-1,"parentid":27}]
    
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
	assert(rows,"err0146e--rows bad");

	switch(rows.length) {
	case 1:
	    await sendOldAssignment(rows[0],req,res,next); 
	    return; //DONE!   <-----------------NORMAL exit is here  <-----------------
	case 0:
	    if (await createNewAssignment(req,res,next)) {
		continue;  //try again
	    } else {
		console.log("pnt1550w: no new assignments can be created");
		return;
	    }
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
    select  problem.problemId, assignment.playerId,
    problem.prstart, problem.prend, problem.extraproblem,
    problem.anstart, problem.anend, problem.extraanswer
    from problem  left join  assignment  on  assignment.problemId=problem.problemId
    inner join game on game.gameId=problem.gameId
    inner join playergame on game.gameId=playergame.gameId
    inner join player on player.playerId=playergame.playerId
    where problem.anstart is null   
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
	    return 0;
	}
	goodProblemId = sqlRes.problemid;
    } catch(ex) {
	console.log("err1110s:"+ex);
	res.status(500).end("err1444s");
	return 0;
    };
    assert(goodProblemId>0,"err1218c,goodProblemId="+JSON.stringify(goodProblemId));
    
    var sql1=""+
	"insert into assignment ( playerid, problemId,   sentat, sentip     )"+
	"     values            ( $1      , $2,      datetime(), $3         );"+
        ""; 
    var params1 = [              playerId,goodProblemId,/*fromSql,*/  sentIp   ];
    var code=await db.runAsync( sql1, params1 )
    assert(!code,"err9731w--insert complete"+code);

    return 1;
}


async function sendOldAssignment(assignment,req,res,next){
    const mimeType = 'text/javascript';
    res.setHeader('Content-Type', mimeType);
    res.end(JSON.stringify(assignment));
}

function lc(x) {
    return (""+x).toLowerCase();
}



//bugbug etc etc  must be a list of approve values, not just anything the user sent us !!! else script injection
const approvedDomains='condition,drug,sideeffect,treatment,organ,symptom,type,riskfactor,medtest'.split(',');
//condition|169,drug|533,sideeffect|62,treatment|168,organ|110,symptom|82,riskfactor|79,test|122

//bugbug should we memoize/cache response?
async function getDomain(req,res,next){    
    var domain=lc(req.params.domain);
    //bugbug you are here this is supposed to happen in step2
    if (domain=='test')
	domain='medtest';
    console.log(domain);
    assert(approvedDomains.includes(domain));//bugbug more than assert (should run even if not in debug the way I wrote it, it's not a debug-flagged thing)


    var sql = " select * from dd where dd=?; ";
    var bigList = await db.allAsync(sql,[domain]);

    console.log(bigList);
    //res.setresponseType?
    //res.status(200).end(bigList);
    

    const mimeType = 'text/javascript';
    res.setHeader('Content-Type', mimeType);
    res.status(200).end(JSON.stringify(bigList));



    /*
    if (assignmentId != ""+req.body.assignmentid) {
	assert(false,"err1834: params:"+JSON.stringify(req.params)+"!!!body:"+JSON.stringify(req.body)  );
	res.status(500).end("badly formed response");
	return;
    }

    assert(userResult.extraresult,"err0115q"+userResult);
    show("userResult.extraresult",userResult.extraresult);
    var extraresult = JSON.stringify(userResult.extraresult);
    show("bugbug2135d",typeof extraresult);
    */
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


//extra apis can these be combined in somehow?
var halDom = express();
halDom.get("/:domain",getDomain);

//just halite
var halApp = express();
halApp.use('/favicon.ico', serveIconFile);
halApp.use('/statics', express.static('../statics')); 
halApp.use('/crits',express.static('../crits'));
halApp.use("/assignment/", halApi);
halApp.use("/domain/", halDom); 



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

