'use strict'

const sqlite = require('sqlite3').verbose();
const prolib = require('./sqliteAsync');
//no install possible now...const sqlite = require('sqlite').verbose();
const dbx = new sqlite.Database(':memory:');
const db = prolib.promote(dbx);
console.log(typeof prolib);
/*

db.getAsync = function (sql) {
    var that = this;
    return new Promise(function (resolve, reject) {
	that.get(sql, function (err, row) {
	    if (err)
		reject(err);
	    else
		resolve(row);
	});
    });
};

db.allAsync = function (sql) {
    var that = this;
    return new Promise(function (resolve, reject) {
	that.all(sql, function (err, rows) {
	    if (err)
		reject(err);
	    else
		resolve(rows);
	});
    });
};

db.runAsync = function (sql) {
    var that = this;
    return new Promise(function (resolve, reject) {
	that.run(sql, function(err) {
	    if (err)
		reject(err);
	    else
		resolve();
	});
    })
};

async function voteAsync(voter) {
    var val;
    var getStmt = `SELECT Name, Count FROM Voters WHERE Name="${voter}"`;
    console.log(getStmt);
    var row = await db.getAsync(getStmt);
    if (!row) {
	console.log("VOTER NOT FOUND");
	var insertSql = `INSERT INTO Voters (Name, Count) VALUES ("${voter}", 1)`;
	console.log(insertSql);
	await db.runAsync(insertSql);
	val = 1;
	return;
    }
    else {
	val = row["Count"];
	console.log(`COUNT = ${val}`);
	val += 1;

	// update
	var updateSql = `UPDATE Voters SET Count = ${val} WHERE Name = "${voter}"`;
	console.log(updateSql);
	await db.runAsync(updateSql);
    }

    console.log(`RETURN ${val}`);
    return val;
}
*/


    
async function main() {
    try {
	var stmt = "CREATE TABLE IF NOT EXISTS Voters (Name TEXT, Count int)";
	console.log(stmt);
	await db.runAsync(stmt,[]);
	//var val = await voteAsync("john doe");
	//console.log(`New vote for John Doe is ${val}`);
    }
    catch (ex) {
	console.log("ex="+JSON.stringify(ex));
    }
}

main();

