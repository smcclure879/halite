



with recursive
    rootOf(level,problemId,parentId)
    as (
    values(1,0,450) --fake row
    union all
    select rootOf.level-1 , problem.problemId, problem.parentId
    from problem join rootOf on rootOf.parentId=problem.problemId
--    where hashid='.2k3q-elqiw'
    order by 1 desc 
)
select --coalesce(substr('.................',1,rootOf.level*3),'X'),
       rootOf.level,
       problem.problemId,
       problem.parentId,
       game.gameName,
       --       problem.hashid,
       problem.problemData,
       coalesce(       problem.answer, '  ----NYA----  ')
from rootOf
join problem
on rootOf.problemId=problem.problemId
join game
on game.gameid=problem.gameid
order by problem.problemId asc --select coalesce(substr('.................',1,level*3), problemId) FROM rootOf
--order by hashid,rootOf.level,problem.problemId
;





/*
select
	par.problemid as popid,
	kid.parentid as parentid,
	par.problemdata,
	kid.problemid as kidid,
	par.answer
--select par.problemId,kid.problemId,par.answer,kid.parentId
from      problem par
left join problem kid
on        par.problemId=kid.parentId

where  par.hashid='.2k3q-elqiw'

group by popid,kidid
--having kid.parentId is null
;
*/


/*WITH RECURSIVE
    under_alice(level,name)
    AS (
       VALUES(0,'Alice')
       UNION ALL
SELECT  under_alice.level+1  ,  org.name
FROM org JOIN under_alice ON org.boss=under_alice.name
ORDER BY 1
)
SELECT substr('.................',1,level*3) || name FROM under_alice;
*/

