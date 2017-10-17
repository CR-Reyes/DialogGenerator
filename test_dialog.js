/**
 * Unit Test file
 * 
 * This file will serve to do an automatic, thorough and exhaustive
 * test of the Watson conversation service. It will create a model
 * close the the one of the service regarding the intents and entities,
 * and it will test the dialogs with combinations between this elements.
 */

var Watson = require('../../utils/watson.js');
var fs = require('fs');
var csv = require('csv-parse');
var GetSheetData = require('../../utils/google_drive/get_sheet_data.js')

// GLOBAL VARIABLES
// Create Watson Object (service username, service password, workspace id)
var watson = new Watson('00e8112d-4029-454f-a732-fd0771c96776', 'LJhYIuTOIIHG', '7d83295a-ee56-4027-b469-164048907465');
// GetSheetData Object containing the sheets' ids
var getSheetData = new GetSheetData({
    entities: '1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM',
    answers: '1XCM0_X1VB6Hh-tU_2zeQnuRQ_65D211ZC1gXpap5QEI',
    analysis: '1Jax1niDL-sbNRUHCBxMlwflwCbfHBHfbUYRfhRssaDQ'
});

// Entity hash, the keys are the values of the entity
var entities = {};
// Templates hash, the keys are the names of the template
var templates = {};
// Cases array, containing the expected id, answer and resources.
var cases = [];
// Log object to record every case attempt
var logs = [];
// Conversation context to have the conversation started
var context;

// Export the first function
module.exports = readEntities;

// Start the process
readEntities(function (logs) {
    // filters the cases in which the test didn't pass
    storeAs("errors", logs.filter(function (log) {
        return !log.success;
    }))
});

/**
 * Stores an object in a Json file
 * 
 * @param {string} name 
 * @param {Object} values 
 * @param {function} callback 
 */
function storeAs(name, values, callback) {
    fs.writeFile(__dirname + "/output/" + name + ".json", JSON.stringify(values), function () {
        console.log("JSON for " + name + " stored to " + __dirname + "/output/");
        if (callback != null) callback();
    });
}

/**
 * Reads the entities from the google sheet and saves them in the object
 * 
 * @param {function} callback 
 */
function readEntities(callback) {

    // Get the data from the Entities sheet
    getSheetData.getEntities(function (values) {

        // The entities format comes the way we need it
        entities = values;

        // Just add the entity value as a synonym
        Object.keys(entities).forEach(function (value) {
            entities[value].synonyms.push(value);
        })

        // Save the object in a file
        storeAs("values", entities, function () {
            readTemplates(callback);
        });
    })
}

/**
 * Reads the templates from the google sheet and saves them in the object
 * 
 * @param {function} callback 
 */
function readTemplates(callback) {

    // Initialize the template object
    templates = {};

    // Get the template data from the sheet
    getSheetData.getTemplates(function (temps) {

        // For each intent
        Object.keys(temps).forEach(function (intent) {

            // Get the templates of the intent and initialize the intent object
            intent_temps = temps[intent];
            templates[intent] = {};

            // For each template
            intent_temps.forEach(function (template) {

                // Get the "[entitiy]" count
                var entities_count = 0;
                var matches = template.match(/\[Entity\]/g);
                if (matches) entities_count = matches.length;

                // Initialize the set for the count 
                if (!templates[intent][entities_count]) {
                    templates[intent][entities_count] = {};
                }

                // Push the template into the intent and count
                templates[intent][entities_count][template] = true;

            });

            // For each group of templates grouped by entity count
            Object.keys(templates[intent]).forEach(function (count) {
                // Turn the set into an array
                templates[intent][count] = Object.keys(templates[intent][count]);
            })
        })

        // Store the object in a file
        storeAs("templates", templates, function () {
            readCases(callback)
        });
    })
}

/**
 * Reads the tree from the google sheet and converts it to the cases object
 * 
 * @param {function} callback 
 */
function readCases(callback) {

    // Initialize the array
    cases = [];

    // Get the tree data from the sheet
    getSheetData.getTree(function (tree) {

        // For each intent
        Object.keys(tree).forEach(function (intent) {

            // For each node in the intent
            Object.keys(tree[intent]).forEach(function (id) {

                // Push the data needed for the test case
                cases.push({
                    id: id,
                    intent: intent,
                    entities: tree[intent][id].entities
                })
            })
        })

        // Save the object in a file
        storeAs("cases", cases, function () {
            main(callback);
        });
    })
}

/**
 * Starts the main function to start the testing
 * 
 * @param {function} callback 
 */
function main(callback) {

    // Initialize the logs array
    logs = [];

    // Override to keep console logs clean
    watson.override_log(function (keys, object) {
        // Nothing
    })

    watson.getResponse("", "", null, function (_, _, cont, _) {

        // Initialize the conversation context
        context = cont;

        // Start testing
        send_case(0, callback);
    })
}

/**
 * Test the case number defined by the index, when done, calls the callback function with the logs object
 * 
 * @param {int} index 
 * @param {function} callback 
 */
function send_case(index, callback) {

    // Print case number to show progress
    process.stdout.write("\t" + (index / cases.length * 100) + "\r");

    // Gets the intent templates and select a random one
    var intent_templates = templates[cases[index].intent][cases[index].entities.length];
    var template = intent_templates[parseInt(Math.random() * intent_templates.length)];

    // Copies the template and substitutes the "[Entity]"" for values
    var message = template;
    cases[index].entities.forEach(function (entity) {
        var synonyms = entities[entity].synonyms;
        message = message.replace(/\[Entity\]/, synonyms[parseInt(Math.random() * synonyms.length)]);
    })

    // Sends the message message to check the case
    watson.getResponse("", message, context, function (_, answer, context, response) {

        // Gets the visited nodes
        var visited = response.output.nodes_visited;

        // Records the last visited node
        var received_id = visited[visited.length - 1].replace(" ", "+");

        // Logs the test case attempt
        logs.push({
            id: cases[index].id,
            received_id: received_id,
            intent: cases[index].intent,
            entities: cases[index].entities,
            template: template,
            message: message,
            success: received_id == cases[index].id,
            received_intents: response.intents,
            received_entities: response.entities
        })

        // If cases are missing, test them
        if (++index < cases.length && index < 10) {
            send_case(index, callback);

        } else {
            // Else, store the logs and call the callback with the logs
            storeAs("logs", logs, function () {
                callback(logs)
            });
        }
    });
}