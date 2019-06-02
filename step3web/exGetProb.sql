select problem.problemId,problem.answer,assignment.playerId
    from problem left join assignment on assignment.problemId=problem.problemId
    inner join game on game.gameId=problem.gameId
    inner join playergame on game.gameId=playergame.gameId
    inner join player on player.playerId=playergame.playerId
    where problem.answer is null
    --where assignment.problemId is null
    and player.playerId=42;

/*    select problem.problemId
    from problem left join assignment on assignment.problemId=problem.problemId
    inner join game on game.gameId=problem.gameId
    inner join playergame on game.gameId=playergame.gameId
    inner join player on player.playerId=playergame.playerId
    where problem.answer is null
    --and assignment.problemId is null
    and player.playerId=$1
    and problem.problemId <> 4
    limit 1;
*/
/*player on assignment.problemId=problem.problemId
    inner join playergame on player.playerId=playergame.playerId
    inner join game on game.gameId=playergame.gameId 
    inner join problem on problem.gameId=game.gameId
    left join 
    where problem.answer is not null
;
*/
