####don't need this anymore    #!/usr/bin/expect

#   or this   #set timeout 20
#or this
#set thepass [exec cat ayvex.db.pwd]

# will likely use something like this to call sqlite version. 
#spawn psql -f sql.sql -h cancerfoolpostgresdb.cj71xdfmswno.us-west-2.rds.amazonaws.com -p 5432 -U ayvex ingest

#instead...this much simpler....

/usr/bin/sqlite3 -bail -batch  ../halite.db  < schema.sql

#late might need password again IFF not local !!
#expect "Password*"
#send "$thepass\r";

#interact
