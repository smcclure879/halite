dd bs=1 if=x.crit of=foo skip=1037 count=65 status=none; cat foo; printf "\n";
