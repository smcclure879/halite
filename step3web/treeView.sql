


--problemID 4
with recursive
    treeOf(level,problemId)
    as (
    values(0,1)
    union all
    select treeOf.level+1 , problem.problemId
    from problem join treeOf on treeOf.problemId=problem.parentId
--    where hashid='.2k3q-elqiw'
    order by 1 DESC
)
select coalesce(substr('.................',1,treeOf.level*3),'X'),
       problem.problemId,
       game.gameName,
       problem.hashid,
       problem.problemData,
       coalesce(       problem.answer, '  ----NYA----  ')
from treeOf
join problem
on treeOf.problemId=problem.problemId
join game
on game.gameid=problem.gameid
--select coalesce(substr('.................',1,level*3), problemId) FROM treeOf
--order by hashid,treeOf.level,problem.problemId
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

