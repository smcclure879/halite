'use strict'
// tools.js
// ========
module.exports = {
    
    //turn obj to array with column order specified
    proj: function(obj,arrPropNames){
	console.log(arrPropNames);
	return arrPropNames.map( function(x) {
	    if (typeof obj[x] == 'undefined')
		throw('bugbug-err0024m-undefined-'+x+JSON.stringify(obj));
	    return obj[x];
	});
    },

    promote: function(db) {
	//it gains all these functions below...


	//single row expected
	db.getAsync=function (sql,vals) {
	    return new Promise(function (resolve, reject) {
		db.get(sql, vals, function (err, row) {
		    if (err)
			reject(err);
		    else
			resolve(row);
		});
	    });
	};

	//single VALUE expected
	db.getScalarAsync=async function (sql,vals,index) {
	    var row = await db.getAsync(sql,vals);
	    console.log("bugbug0128row="+JSON.stringify(row));
	    return row[index];
	}
	
	//dataset expected
	db.allAsync=function (sql,vals) {
	    return new Promise(function (resolve, reject) {
		db.all(sql, vals, function (err, rows) {
		    if (err)
			reject(err);
		    else
			resolve(rows);
		});
	    });
	};

	
	//no return value expected
	db.runAsync=function (sql,vals) {    
	    return new Promise(function (resolve, reject) {
		//console.log("running");
		db.run(sql, vals, function(err,rows) {
		    if (err) {
			//console.log("bugbug"+err);
			reject(err);
		    } else {
			resolve();
		    }
		});
	    })
	};


	db.domainAsync = async function (sql,vals,lookupBy) {
	    var rows = await db.allAsync(sql,vals);
	    var retval = {};
	    for(var row of rows) {
		var key = row[lookupBy];
		retval[key]=row;		
	    }
	    return retval;
	}

	
	//RETURN THE "PROMOTED" DATABASE
	return db; 
	
    }
}

//var sqlite = require('sqlite3').verbose();

