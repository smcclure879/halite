select problem.problemId,player.playerId as problemId
    from problem left join assignment on assignment.problemId=problem.problemId
    inner join game on game.gameId=problem.gameId
    inner join playergame on game.gameId=playergame.gameId
    inner join player on player.playerId=playergame.playerId
    where problem.answer is not null
    and assignment.problemId is null
    and player.playerId=42;


/*player on assignment.problemId=problem.problemId
    inner join playergame on player.playerId=playergame.playerId
    inner join game on game.gameId=playergame.gameId 
    inner join problem on problem.gameId=game.gameId
    left join 
    where problem.answer is not null
;
*/
