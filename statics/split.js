function getPlayerId(){
    return 42;  //bugbug fake
}



function showAssignmentText(assignment) {  //from myAssignment view
    //   (assignmentId,    problemid,     playerid,   sentat,  resultat,
    //    gameid,  gameName, hashid, problemdata, parentProblemId)
    //fullPath like...      /crits/2/v/j/o/2vjo-2367x.crit
    var fullPath=getPathFromHash(assignment.hashid);
    alert(JSON.stringify(assignment)+fullPath);
    
    $.ajax({
	type: "GET",      //POST does a create, no id given. nothing really. gives back whole assignment
	url: fullPath,
	success: function(res){
	    tt.value=res;
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

function getData_the_fakeold_getAssignment() {
    return {
	assignId: '2cun-ounjc',
	jobUri: '/NCT01666808/h.fsq0dai23x98/toplevel',
	game: 'toplevel',
	text: `        Inclusion Criteria:

          -  Adenocarcinoma of the prostate, post radical-prostatectomy Detectable PSA

          -  ECOG/Zubrod Performance Status of 0-2

          -  Negative technetium 99-m MDP or F-18 PET bone scan for skeletal metastasis

          -  CT or MR scan of abdomen and pelvis which does not suggest presence of metastatic
             disease outside of the pelvis

          -  Willingness to undergo pelvic radiotherapy.

        Exclusion Criteria:

          -  Contraindications to radiotherapy (including active inflammatory bowel disease or
             prior pelvic XRT)

          -  Inability to undergo anti-3-[18F]FACBC PET-CT

          -  Age under 18

          -  Metastatic disease outside of pelvis on any imaging or biopsy

          -  Prior invasive malignancy (except non-melanomatous skin cancer) unless disease free
             for a minimum of 3 years

          -  Severe acute co-morbidity, defined as follows:

               -  Unstable angina and/or congestive heart failure requiring hospitalization in the
                  last 3 months

               -  Transmural myocardial infarction within the last 6 months

               -  Acute bacterial or fungal infection requiring intravenous antibiotics at the time
                  of registration

               -  Chronic Obstructive Pulmonary Disease exacerbation or other respiratory illness
                  requiring hospitalization or precluding study therapy at the time of registration

               -  Acquired Immune Deficiency Syndrome (AIDS) based upon current CDC definition;
                  note, however, that HIV testing is not required for entry into this protocol. The
                  need to exclude patients with AIDS from this protocol is necessary because the
                  treatments involved in this protocol may be significantly immunosuppressive.
                  Protocol-specific requirements may also exclude immunocompromised patients
      
`};
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
    if (game=='toplevel') {
	splitGame();
    } else {
	alert("game "+game+" is NYI. err2014v");
	alert(assignment);
    }
	
    
}

/*function otherJunkbugbug() {
    //do we retain notion of jobUri???  bugbug
    var uri = assignment.jobUri;
    var uriParts = uri.split('/');
    var game2 = last(uriParts);

    if (game2 != game) {
	alert("errCode1812a: "+game2+"-----"+game);	
    }


}
*/

//most games are like this...simple translations to the setup....
function splitGame() {
    addButtons([
	['AND', 'SPLIT'],   //an AND button, labelled "split"
	['HUH', 'HUH']      //
    ]);
    
    alert("identify the toplevel split point.");
}


function addButtons(btns) {
    btns = new Map(btns);
    btns.forEach( (v,k) => {
	buttons.innerHTML = buttons.innerHTML +
	    '<input type="button" value="' + v + '" onclick="bb(this,\''+k+'\')" />   <br />';
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
