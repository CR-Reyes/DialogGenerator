/**
 * Function for testing purposes
 */
function main() {
    // Logger.log(GET_IDS("https://docs.google.com/spreadsheets/d/1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM/edit", "IDs!A2:B",
    //     "https://docs.google.com/spreadsheets/d/1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM/edit", "IDs!A2:B",
    //     "CSV!B2:Z", "https://docs.google.com/spreadsheets/d/1Jax1niDL-sbNRUHCBxMlwflwCbfHBHfbUYRfhRssaDQ/edit", "Preguntas Finales!B2:M"))
    // Logger.log(GET_QUESTIONS("IDs!A2:Z", "Respuestas!A2:A"));
    // Logger.log(GET_IDS_ANSWERS("IDs!A2:Z", "Respuestas!A2:Z",
    //     "https://docs.google.com/spreadsheets/d/1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM/edit", "IDs!A2:B",
    //     "https://docs.google.com/spreadsheets/d/1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM/edit", "IDs!A2:B"))
}

/**
 * Updates the functions when the valur for update is changed
 * 
 * @param {Event} e 
 */
function onEdit(e) {
    // Only if info is edited
    if (e.range.getSheet().getName() == "Info") {

        // Update the functions of each sheet
        e.range.getSheet().getParent().getSheets().forEach(function (sheet) {
            if (sheet.getName() == "Preguntas faltanes") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=GET_QUESTIONS("IDs!A2:J"; "Respuestas!A2:A"; "' + Math.random() + '")');
            } else if (sheet.getName() == "Arbol") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=GET_IDS_ANSWERS("IDs!A2:Z"; "Respuestas!A2:Z"; Info!C2; "IDs!A2:B";Info!C3; "IDs!A2:B"; "' + Math.random() + '")');
            } else if (sheet.getName() == "IDs") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=GET_IDS(Info!C2;"IDs!A2:B";Info!C3;"IDs!A2:B";"CSV!B2:I";Info!C4;"Preguntas Finales!B2:Z"; "' + Math.random() + '")');
            }
        });
    }
}

/**
 * This function to get the intents and entities and change it to its id
 * 
 * @param {string} intentsSheet url for the intents sheet
 * @param {string} intentsA1 range for the intent in the A1 format
 * @param {string} entitiesSheet url for the entities sheet
 * @param {string} entitiesA1 range for the entities in the A1 format
 * @param {string} valuesA1 range for the entities values in the A1 format
 * @param {string} analysisSheet url for the analysis sheet
 * @param {string} analysisA1 range for the final questions in A1 format
 * @param {Object} updateParam random value tu update the function
 */
function GET_IDS(intentsSheet, intentsA1, entitiesSheet, entitiesA1, valuesA1, analysisSheet, analysisA1, updateParam) {

    // Get the intents' ids values
    var iss = SpreadsheetApp.openByUrl(intentsSheet);
    var irange = iss.getRange(intentsA1);
    var ivalues = irange.getDisplayValues();

    // Relate each intent with its id
    var intents_ids = {};
    ivalues.forEach(function (value) {
        intents_ids[value[0]] = value[1];
    });

    // Get the entities' values' ids
    var ess = SpreadsheetApp.openByUrl(entitiesSheet);
    var erange = ess.getRange(entitiesA1);
    var evalues = erange.getDisplayValues();

    // Relate each values with its intent
    var entities_ids = {};
    evalues.forEach(function (value) {
        entities_ids[value[0]] = value[1];
    });

    // Get the questions from the final questions
    var ass = SpreadsheetApp.openByUrl(analysisSheet);
    var arange = ass.getRange(analysisA1);
    var avalues = arange.getDisplayValues();

    // For each question
    for (var i = 0; i < avalues.length; i++) {

        // Replace the intent for the id
        avalues[i][2] = intents_ids[avalues[i][2]];

        // Divide the entities
        var entities = avalues[i].slice(3);
        // Order them alphabetically
        entities.sort(function (a, b) {
            if (a == b) return 0;
            if (a == "") return 1;
            if (b == "") return -1;
            return a.localeCompare(b);
        });

        // Change the entities for their ids
        for (var j = 3; j < avalues[i].length; j++) {
            avalues[i][j] = entities_ids[entities[j - 3]];
        }
    }

    // Hashmaps for further searchs
    var ids = {};
    var parents = {};

    // For each question, check the parent
    for (var i = 0; i < avalues.length; i++) {

        // Register the parent
        parents[avalues[i][1]] = avalues[i][0];

        // Create the id
        var id = avalues[i][2] + "-";
        for (var j = 3; j < avalues.length; j++) {
            if (avalues[i][j] == "") break;
            id += avalues[i][j] + "+";
        }

        // Remove las character(- or +)
        id = id.substring(0, id.length - 1);

        // Register id
        ids[avalues[i][1]] = id;
    }

    // Get the id of the Parent
    for (var i = 0; i < avalues.length; i++) {
        avalues[i][0] = ids[parents[avalues[i][1]]];
    }

    // Create the response array
    var response = [];

    // Reduce the response array
    for (var i = 0; i < avalues.length; i++) {
        if (avalues[i][1] == "" || avalues[i][1] == null) break;
        response.push(avalues[i]);
    }

    // Sort by intent and the by question alphabetically
    response.sort(function (a, b) {
        return (a[2] == b[2]) ? a[1].localeCompare(b[1]) : a[2].localeCompare(b[2]);
    })

    // Return the result
    return response;
}

/**
 * Function to compare the questions in ID and the ones in the answer sheet
 * 
 * @param {string} questionsA1 Questions from the IDs tab
 * @param {string} old_questionsA1 Questions from the answers tab
 * @param {*} updateParam value to change to update the result
 */
function GET_QUESTIONS(questionsA1, old_questionsA1, updateParam) {

    // Get the questions from the IDS
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(questionsA1);
    var values = range.getDisplayValues();

    // Get the questions from the answers
    var old_range = ss.getRange(old_questionsA1);
    var old_values = old_range.getDisplayValues();

    // Create the id and the parents hashmap
    var ids = {};
    var parents = {};
    for (var i = 0; i < values.length; i++) {

        // Create the id for the question
        var id = values[i][2] + "-";
        for (var j = 3; j < values.length; j++) {
            if (values[i][j] == "") break;
            id += values[i][j] + "+";
        }

        // Remove the last char (- or +)
        id = id.substring(0, id.length - 1);

        // Assign the parent and id
        parents[values[i][1]] = values[i][0];
        ids[values[i][1]] = id;
    }

    // Remove the questions that have parent
    Object.keys(parents).forEach(function (q) {
        if (parents[q] != "") delete ids[q];
    });

    // Create the hashmap for the existing questions
    var old_questions = {};
    old_values.forEach(function (value) {
        old_questions[value] = true;
    });

    // Create the response array
    var response = [];
    Object.keys(ids).forEach(function (key) {

        // If the question doesnt exist, add it to the response
        if (old_questions[ids[key]] == null) {
            response.push([ids[key], key]);
        }
    });

    // Respond OK if no new questions or the questions otherwise
    return (response.length == 0) ? "OK" : response;
}

/**
 * Function to create the conversation tree
 * 
 * @param {string} questionsA1 range from the questions from the IDs
 * @param {string} answersA1 range from the questions from the asnwers
 * @param {string} intentsSheet url from the intents sheet
 * @param {string} intentsA1 range for the intents ids
 * @param {string} entitiesSheet url from the entities sheet
 * @param {string} entitiesA1 range for the entities ids
 * @param {*} updateParam value to change when the results needs to update
 */
function GET_IDS_ANSWERS(questionsA1, answersA1, intentsSheet, intentsA1, entitiesSheet, entitiesA1, updateParam) {

    // Get the questions from the IDs
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(questionsA1);
    var values = range.getDisplayValues();

    // Get the answers
    var arange = ss.getRange(answersA1);
    var avalues = arange.getDisplayValues();

    // Create the hashmaps for the tree creation
    var questions = {};
    var answers = {};
    var parents = {};

    // Create the id and parent for each question
    values.forEach(function (value) {

        // Create the id
        var id = value[2] + "-";
        for (var i = 3; i < value.length; i++) {
            if (value[i] == "") break;
            id += value[i] + "+";
        }

        // Remove the last char (- or +)
        id = id.substring(0, id.length - 1);

        // Set the question and parent by id
        questions[id] = value[1];
        parents[id] = value[0];
    });

    // Join the answer and resources in a single string
    avalues.forEach(function (value) {

        // Push all the resources in a single array
        var rss = [];
        for (var i = 3; i < value.length; i++) {
            if (value[i] == "") break;
            var index = value[i].indexOf(":");
            var key = value[i].substring(0, index).trim();
            var val = value[i].substring(index + 1, value[i].length).trim();
            rss.push({ type: key, value: val });
        }

        // Create the joint answer if there are any resources
        var answer;
        if (rss.length == 0) {
            answer = value[2];
        } else {
            answer = value[2] + " ||| " + JSON.stringify(rss);
        }

        // Add the answer by id
        answers[value[0]] = answer;
    });

    // Create the response array
    var response = [];

    // Get the intents IDs
    var iss = SpreadsheetApp.openByUrl(intentsSheet);
    var irange = iss.getRange(intentsA1);
    var ivalues = irange.getDisplayValues();

    // Create an id-intent hashmap
    var intents_ids = {};
    ivalues.forEach(function (value) {
        intents_ids[value[1]] = value[0];
    });

    // Get the entities IDs
    var ess = SpreadsheetApp.openByUrl(entitiesSheet);
    var erange = ess.getRange(entitiesA1);
    var evalues = erange.getDisplayValues();

    // Create an id-value hashmap
    var entities_ids = {};
    evalues.forEach(function (value) {
        entities_ids[value[1]] = value[0];
    });

    // Parse the id to revert the id to intents and entities, and set the answer
    Object.keys(questions).forEach(function (key) {

        // Separate id from entities
        var ids = key.split("-");

        // Get the entities array
        var entities = [];
        var ents = [];
        if (ids[1]) ents = ids[1].split("+");
        ents.forEach(function (ent) {
            entities.push(entities_ids[ent]);
        });

        // Get the answer
        var answer = "";
        if (parents[key] != "") {

            // if the question has a parent, set that answer
            answer = answers[parents[key]];
        } else {

            // Else, set the normal answer
            answer = answers[key];
        }

        // Push the node information
        response.push([key, answer, intents_ids[ids[0]]].concat(entities));
    });

    // Return the result
    return response;
}