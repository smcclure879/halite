


--problemID 4
with recursive
    treeOf(level,problemId)
    as (
    values(0,4)
    union all
    select treeOf.level+1 , problem.problemId
    from problem join treeOf on treeOf.problemId=problem.parentId
    order by 1
)
select coalesce(substr('.................',1,treeOf.level*3),'X'),
       problem.problemId,
       problem.hashid,
       problem.problemData
from treeOf
join problem
on treeOf.problemId=problem.problemId
--select coalesce(substr('.................',1,level*3), problemId) FROM treeOf
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

