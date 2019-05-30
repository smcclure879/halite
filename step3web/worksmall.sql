select
	par.problemid as popid,kid.parentid as parentid,
	par.hashid,par.problemdata,kid.problemid as kidid,par.answer
--select par.problemId,kid.problemId,par.answer,kid.parentId
from      problem par
left join problem kid
on        par.problemId=kid.parentId
where par.answer is not null
group by popid,kidid
having kid.parentId is null;
