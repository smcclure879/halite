insert into player (uniqueName, playerid) values ('fake user',42);
insert into playergame (playerId,gameId,canPlay) select 42,gameId,'y' from game where gameId<500;
