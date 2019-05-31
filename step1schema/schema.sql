pragma foreign_keys=ON;  --bugbug does this apply forever to the db or just this session of sqlite???

create table if not exists game (
       gameid integer primary key,   --mastered elsewhere, hence not autonum/serial ???
       gamename varchar(20) not null,
       n int not null,
       m int not null
);

create table if not exists player (
       playerid integer primary key,  --mastered elsewhere???
       uniquename varchar(20) not null
);

create table if not exists playergame (  --can player play game, etc
       playerid integer player,
       gameid integer game references game,
       canPlay varchar(10) not null,
       primary key (playerId,gameId)
);

create table if not exists problem (  --game plus init data
       problemid integer primary key autoincrement,
       gameid integer references game,
       hashid varchar(20) not null,
       problemdata varchar(4000),
       parentid integer references problem,  --selfref is root indicator
       answer varchar(4000),
       UNIQUE(hashid,gameid,problemdata)
);

create table if not exists assignment( -- problem plus player
       assignmentid integer primary key autoincrement,
       problemid integer references problem,
       playerid integer references player,
       sentat datetime not null,
       sentip varchar(100) not null,
       resultat datetime ,
       resultip varchar(100),
       result varchar(200),
       unique(playerid,problemid)
);

