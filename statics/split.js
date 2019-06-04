function getPlayerId(){
    return 42;  //bugbug fake
}

function mySubstring(str,start,end){
    var ll=str.length;
    if (end<0)
	end = end + ll + 1;
    return str.substr(start,end-start);
}

function assert(fact,label) {
    if (!fact)
	alert(label);
    
}


assert(mySubstring("abc",0,-1)=="abc","bugbug2245i");
assert(mySubstring("abc",0,1)=="a","bugbug0078j");

function showAssignmentText(assignment) {  //from myAssignment view
    //   (assignmentId,    problemid,     playerid,   sentat,  resultat,
    //    gameid,  gameName, hashid, problemdata, parentProblemId)
    //fullPath like...      /crits/2/v/j/o/2vjo-2367x.crit
    var fullPath=getPathFromHash(assignment.hashid);
    //alert(JSON.stringify(assignment)+fullPath);


    var problemData=JSON.parse(assignment.problemdata);
    assert(problemData,"bugbug0138i");
    var start = problemData.start;
    var end = problemData.end;
    assert(start>-1 ,"bugbug0123m"+JSON.stringify(problemData));
    
    
    $.ajax({
	type: "GET",      //POST does a create, no id given. nothing really. gives back whole assignment
	url: fullPath,
	success: function(contents){
	    tt.value=mySubstring(contents,start,end);
	    runGame(assignment);
	},
	fail: function(err) {
	    alert("ajax err="+err);
	},
    });


    

}


const newItemMatch = /(\.(\w)(\w)(\w)(\w)-\w{5})/g ;    
function getPathFromHash(hashid) {
    var matches = newItemMatch.exec(hashid);
    if (!matches)
	throw("bad hashid err0720p"+hashid);

    matches = Array.from( matches );
    var hash = matches[1];
    var fileName = hash.substr(1)+".crit";
    
    var dir="../crits/"+matches[2]+"/"+matches[3]+"/"+matches[4]+"/"+matches[5];
    //var nct= matches[6];
    var fullPath=dir+"/"+fileName;
    //fhw.open(dir,fileName);//synchronous, autocloses previous
    //addTopLevelProblemToDb(hash,nct,matches[7],matches[8],function(){console.log('done');});
    return fullPath;
}



function getAssignment(cb) {
    $.ajax({
	type: "POST",      //POST does a create, no id given. nothing really. gives back whole assignment
	url: '/assignment/',
	data: {"playerId":getPlayerId()},
	success: function(res){
	    cb(res);
	},
	fail: function(err) {
	    alert("ajax err="+err);
	},
	dataType: "json"
    });
    
}



function last(arr) {
    return arr[arr.length-1];
}

var tt=null;
window.onload=function() {
    
    //use text field a lot...
    tt=document.getElementById("t");
    tt.value="loading";

    //jobUri = '/NCT01666808/h.fsq0dai23x98/toplevel';
    //data = getData(jobUri);
    getAssignment(showAssignmentText);
};//then...

    

function runGame(assignment) {
    window.assignment = assignment;  //for later, when submitting
    var game = assignment.gameName;  //not gameId

    switch(game){
    case 'toplevel':	splitGame();    return;
    case 'isleaf':      isLeafGame();   return;
    case 'king':        kingGame();     return;
    default:
	alert("game "+game+" is NYI. err2014v");
	alert(assignment);
    }
}



const HUHButton=['HUH','HUH',' cannot do this one '];


function addTitle(text){
    var h = document.createElement("H5");
    var t = document.createTextNode(text);
    h.appendChild(t);
    document.body.insertBefore(h,buttons);
}


//most games are like this...simple translations to the setup....
function splitGame() {
    addTitle("identify the toplevel split point.");
    addButtons([
	['AND', 'SPLIT'],   //an AND button, labelled "split"
	HUHButton
    ]);
    

}

function isLeafGame() {
    addTitle("which is closest description of the text?");
    addButtons([
	['COMPLEX','COMPLEX','made of several smaller statements that might be independently T/F'],
	['KING','KING',      'a single phrase or word (eg INCLUDE) "rules" the rest'],
	['LEAF','SIMPLE',    'a single isolated requirement eg  not taking medicine X  or has disease Y '],
	HUHButton
    ]);
    //alert("is this a COMPLEX statement or a SIMPLE statement?");
}

function kingGame() {
    addTitle("highlight just the king phrase or word");
    addButtons([
	['AND','AND',   'bugbug joined as AND'],
	['OR','OR',     'bugbug joined as OR'],
	HUHButton
    ]);
}

function addButtons(btns) {
    for(var ii in btns) {
	var btn=btns[ii];
	var txt=btn[2] || '';
	var actionCode=btn[0];
	var buttonText=btn[1];
	buttons.innerHTML = buttons.innerHTML +
	    '<input type="button" value="' +buttonText+ '" onclick="bb(this,\''+actionCode+'\')" />  '+txt+' <br />';
    }
}

function addButtons_oldbugbug(btns) {
    btns = new Map(btns);
    btns.forEach( (k,v) => {
	buttons.innerHTML = buttons.innerHTML +
	    '<input type="button" value="' + k + '" onclick="bb(this,\''+v+'\')" />   <br />';
    });
}

//generic button handler...elem is the button that was clicked...
function bb(elem,actionCode){
    var aid =window.assignment.assignmentId;
    $.ajax({
	type: "PUT",
	url: '/assignment/'+aid, 
	data: {
	    assignmentid: aid,
	    start: tt.selectionStart,
	    end: tt.selectionEnd,
	    action: actionCode
	},
	success: function(res){
	    alert("put res="+res);
	},
	fail: function(err) {
	    alert("ajax err="+err);
	},
	dataType: "json"
    });

    
}
