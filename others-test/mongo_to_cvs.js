const fs = require('fs');

var MongoClient = require('mongodb').MongoClient;

var dburl = 'mongodb://localhost:27017/fisica-remedial';

var findAll = function(db, document, callback){
    var collection = db.collection(document);
    collection.find({}).toArray(function(err, docs){
        if(err){
            console.error(err);
        }
        else {
            console.log("found this");
            //console.log(docs);
            callback(docs);
        }
    });
}

var cvs = "";
var poscvs = "";
var negcvs = "";

function dataRead (data, index, callback){
	if(data.length == index){
	    callback();
	} else {
            //
	    message = data[index];
                //console.log(JSON.stringify(message));
                cvs += "\"" + message["input-text"] + "\"" + ",";
                if(message.intents[0]){
                    cvs += message.intents[0].intent;
                }
                cvs += ",\"";
                message.entities.forEach(function(entity){
                    cvs += entity.value + ",";
                });
                if(message.entities.length > 0){
                    cvs = cvs.slice(0, -1);
                }
                cvs += "\",";
                cvs += message["not-found"];
                cvs += "\n";
            //console.log(cvs);
            fs.writeFile(__dirname + "/history.cvs", cvs, function(err) {
                if(err) {
                    return console.log(err);
		}
                console.log("The file was saved!");
            });

                if(!message["not-found"]){
                    //console.log(JSON.stringify(message));
                    poscvs += "\"" + message["input-text"] + "\"" + ",";
                    if(message.intents[0]){
                        poscvs += message.intents[0].intent;
                    }
                    poscvs += ",\"";
                    message.entities.forEach(function(entity){
                        poscvs += entity.value + ",";
                    });
                    if(message.entities.length > 0){
                        poscvs = poscvs.slice(0, -1);
                    }
                    poscvs += "\",";
                    poscvs += message["not-found"];
                    poscvs += "\n";
                }
            //console.log(poscvs);
            fs.writeFile(__dirname + "/historypos.cvs", poscvs, function(err) {
                if(err) {
                    return console.log(err);
                }
		console.log("The file was saved!");
            });

                if(message["not-found"]){
                    //console.log(JSON.stringify(message));
                    negcvs += "\"" + message["input-text"] + "\"" + ",";
                    if(message.intents[0]){
                        negcvs += message.intents[0].intent;
                    }
                    negcvs += ",\"";
                    message.entities.forEach(function(entity){
                        negcvs += entity.value + ",";
                    });
                    if(message.entities.length > 0){
                        negcvs = negcvs.slice(0, -1);
                    }
                    negcvs += "\",";
                    negcvs += message["not-found"];
                    negcvs += "\n";
                }
            //console.log(negcvs);
            fs.writeFile(__dirname + "/historyneg.cvs", negcvs, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
		dataRead(data, index + 1, callback);
            });
	}
}

MongoClient.connect(dburl, function(err, db) {
    if(err){
        console.error(err);
    }
    else {
        console.log("Connected succesfully to mongodb");
        findAll(db, 'messages', function(data){
            /**
   	    var cvs = "";
	    data.forEach(function(message){
		//console.log(JSON.stringify(message));
		cvs += message["input-text"] + ",";
		if(message.intents[0]){
		    cvs += message.intents[0].intent;
		}
		cvs += ",'";
		message.entities.forEach(function(entity){
		    cvs += entity.value + ",";
		});
		if(message.entities.length > 0){
		    cvs = cvs.slice(0, -1);
		}
		cvs += "',";
		cvs += message["not-found"];
		cvs += "\n";
	    });
	    //console.log(cvs);
	    fs.writeFile(__dirname + "/history.cvs", cvs, function(err) {
    	    	if(err) {
            	    return console.log(err);
    	    	}
	        console.log("The file was saved!");
	    });

	    var poscvs = "";
            data.forEach(function(message){
		if(!message["not-found"]){
                    //console.log(JSON.stringify(message));
                    poscvs += message["input-text"] + ",";
                    if(message.intents[0]){
                        poscvs += message.intents[0].intent;
                    }
                    poscvs += ",'";
                    message.entities.forEach(function(entity){
                        poscvs += entity.value + ",";
                    });
                    if(message.entities.length > 0){
                        poscvs = poscvs.slice(0, -1);
                    }
                    poscvs += "',";
                    poscvs += message["not-found"];
                    poscvs += "\n";
		}
            });
            //console.log(poscvs);
            fs.writeFile(__dirname + "/historypos.cvs", poscvs, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });

	    var negcvs = "";
            data.forEach(function(message){
                if(message["not-found"]){
    		    //console.log(JSON.stringify(message));
                    negcvs += message["input-text"] + ",";
                    if(message.intents[0]){
                        negcvs += message.intents[0].intent;
                    }
                    negcvs += ",'";
                    message.entities.forEach(function(entity){
                        negcvs += entity.value + ",";
                    });
                    if(message.entities.length > 0){
                        negcvs = negcvs.slice(0, -1);
                    }
                    negcvs += "',";
                    negcvs += message["not-found"];
                    negcvs += "\n";
		}
            });
            //console.log(negcvs);
            fs.writeFile(__dirname + "/historyneg.cvs", negcvs, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
	    */
	    dataRead(data, 0, function(){
		db.close();
	    });
        });
    }
});

