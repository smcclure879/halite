--uncomment only if needed
----
drop view if exists myAssignment;

create view
myAssignment (assignmentId,    problemid,     playerid,   sentat,  resultat,
	     gameid,  hashid, problemdata, parentProblemId, gameName)
as select     aa.assignmentId, aa.problemid, aa.playerid, aa.sentat, aa.resultat, 
   	      pp.gameid, pp.hashid, pp.problemdata, pp.parentid, gg.gameName

from         assignment as aa
inner join   problem as pp
on           aa.problemId = pp.problemId
inner join   game as gg
on           pp.gameId = gg.gameId

where aa.resultAt is null
;

--uncomment if needed....  select * from myAssignment;
