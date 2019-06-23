
#govt data
node sep.node.js

#IL data
node insertTabular.node.js

#disable most govt data problems....so we can see the whole tree for 1 problem instead
#  ---  need to disable this bugbug.... (for dev work)
sqlite3 ../halite.db < disableMostProbs.sql


