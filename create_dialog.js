// -----------------------------------------------------
// Module: JSON Generator for IBM Watson Conversation
// Description:
//    Automates the process of creating the dialog tree
// Author: Chatbot Fisica Universitaria
// Date: 25-07-2017
// -----------------------------------------------------

// Required modules 
var fs = require('fs');
var GetSheetData = require('../../utils/google_drive/get_sheet_data.js')

// Configuration constants for the Bot
var WORKSPACE_NAME = 'Pruebas automaticas';
var WORKSPACE_DESC = 'Descripcion Workspace';
var WORKSPACE_LANG = 'es';
var WORKSPACE_ANYTHING_ELSE = [
    'No entiendo lo que me quieres decir, podrias decirlo de otra manera?'
];

// Intents, entities, dialogs and categories global object
var intents;
var entities;
var dialogs;
var categories;

// GetSheetData Object containing the sheets' ids
var getSheetData = new GetSheetData({
    entities: '1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM',
    intents: '1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM',
    answers: '1XCM0_X1VB6Hh-tU_2zeQnuRQ_65D211ZC1gXpap5QEI'
});

// Export the first function
module.exports = generateIntents;

// Start the process if file is called from terminal
generateIntents();

/**
 * Stores an object in a Json file
 * 
 * @param {string} name 
 * @param {Object} values 
 */
function storeAs(name, values) {
    fs.writeFile(__dirname + "/output/" + name + ".json", JSON.stringify(values));
    console.log("JSON for " + name + " stored to " + __dirname + "/output/");
}

/**
 * Fills the intents array with intent objects {intent, [examples]}
 * 
 * @param {function} callback callback to return the conversation object
 */
function generateIntents(callback) {

    // Clear the array
    intents = [];

    // Asks for the data in the sheet and receives an object (object[intent]:examples)
    getSheetData.getIntents(function (examples) {

        // For each intent
        Object.keys(examples).forEach(function (intent) {

            // Copy the examples to the correct format
            var examples_text = [];
            examples[intent].examples.forEach(function (example) {
                examples_text.push({ text: example });
            })

            // add the intent and exxamples
            intents.push({ intent: intent, examples: examples_text });
        })

        // Save it to a file
        storeAs("intents", intents);

        // Call the entities function
        generateEntities(callback);
    })
}

/**
 * Fills the entities array with entity objects {entity: [{values, synonyms}]}
 * 
 * @param {function} callback callback to return the conversation object
 */
function generateEntities(callback) {

    // Clears the array
    entities = [];

    // Initialize the categories object to keep track of the values' entity
    categories = {};

    // Ask for the data in the sheet and receives an object (object[values]:{entity, synonyms})
    getSheetData.getEntities(function (values) {

        //Object to prepare the values in the correct format
        var temp_ents = {};

        // For each value
        Object.keys(values).forEach(function (value) {

            // Save the entity for simplicity purposes
            var entity = values[value].entity;

            // Record the entity for the value
            categories[value] = entity;

            // Initialize the array for the entity
            if (temp_ents[entity] == null) temp_ents[entity] = [];

            // Add the object to the entity array
            temp_ents[entity].push({ value: value, synonyms: values[value].synonyms })
        })

        // For each entity in the temporary object
        Object.keys(temp_ents).forEach(function (entity) {

            // Push the values in the correct format
            entities.push({ entity: entity, values: temp_ents[entity] });
        })

        // Store the object in a file
        storeAs("entities", entities);

        // Call the next function
        generateDialog(callback);
    })
}

/**
 * Generates the conversation tree for the service
 * 
 * @param {function} callback callback to return the conversation object
 */
function generateDialog(callback) {

    // Clear the dialog array
    dialogs = [];

    // Get the conversation tree data from the Answers sheet
    getSheetData.getTree(function (tree) {

        // Object to keep track of the first node of the tree
        var intents = {};

        // Array to add the end dialogs
        var branch_dialogs = [];

        // For each intent of the tree
        Object.keys(tree).forEach(function (intent) {

            // Initialize the intent branch variables
            var branch = [];
            var previous_sibling = null;

            // Variable to save the personalized reprompt node
            var reprompt = null;

            // For each node data in the intent object
            Object.keys(tree[intent]).forEach(function (id) {

                // Get the dialog id and remove the invalid characters ("+")
                var dialog = tree[intent][id];
                var dialog_node = id.replace(/\+/g, " ");

                // Divide the response in text response and resources
                var response = dialog.response.split(" ||| ")[0]
                var rss = dialog.response.split(" ||| ")[1];
                if (rss == null) rss = "[]";
                var resources = JSON.parse(rss);

                // Generate the condition in format "True [&& @entity:(value) [&& @entity:(value) [...]]]"
                var condicion = "True";
                for (var j = 0; j < dialog.entities.length; j++) {
                    condicion += " && @" + categories[dialog.entities[j]] + ":(" + dialog.entities[j] + ")";
                }

                // Create the node in the service format
                var node = {
                    parent: intent,
                    conditions: condicion,
                    dialog_node: dialog_node,
                    previous_sibling: previous_sibling,
                    output: {
                        text: {
                            values: [
                                response
                            ],
                            selection_policy: "random"
                        }
                    },
                    context: {
                        rss: resources
                    }
                }

                // if the node has entities for the condition
                if (dialog.entities.length > 0) {

                    // Add the node to the branch registering the number of entities
                    branch.push({
                        count: dialog.entities.length,
                        node: node
                    })

                    // save the node's id pushed to branch
                    previous_sibling = dialog_node;

                } else {
                    // Else, it is the reprompt node
                    reprompt = node
                }

            });

            // Order the nodes by entity count
            branch.sort((a, b) => {
                return b.count - a.count
            });


            // Add the exit node
            branch.push({
                count: "exit",
                node: {
                    parent: intent,
                    conditions: "$reprompt",
                    dialog_node: intent + " Exit",
                    context: {
                        reprompt: false
                    },
                    next_step: {
                        behavior: "jump_to",
                        selector: "condition",
                        dialog_node: "Anything Else"
                    },
                    previous_sibling: previous_sibling,
                    output: {}
                }
            });

            // Add the Reprompt node, create it if there wasnt a custom one
            if (reprompt == null) {
                branch.push({
                    count: "reprompt",
                    node: {
                        parent: intent,
                        conditions: "anything_else",
                        dialog_node: intent + " Reprompt",
                        context: {
                            reprompt: true
                        },
                        next_step: {
                            behavior: "jump_to",
                            selector: "user_input",
                            dialog_node: branch[0].node.dialog_node
                        },
                        previous_sibling: intent + " Exit",
                        output: {
                            text: {
                                values: [
                                    'Veo que me estas preguntando algo que ver con "' + intent + '", pero no entiendo bien, podrías preguntarlo de otra manera?'
                                ],
                                selection_policy: "random"
                            }
                        }
                    }
                });
            } else {
                branch.push({
                    count: "reprompt",
                    node: reprompt
                })
            }

            // Register the first node in the branch for the jump to
            if (intents[intent] == null) intents[intent] = branch[0].node.dialog_node;

            // Pass the branch nodes to the main branch dialogs array
            for (var i = 0; i < branch.length; i++) {
                // console.log(branch[i].node.parent, branch[i].count);
                branch_dialogs.push(branch[i].node);
            }
        })

        // Create the welcome node
        dialogs.push({
            parent: null,
            conditions: "conversation_start",
            dialog_node: "Welcome",
            previous_sibling: null,
            output: {
                text: {
                    values: [
                        "Hola, con que te puedo ayudar"
                    ],
                    selection_policy: "random"
                }
            }
        });

        // Variable to save the past node
        var previous_sibling = "Welcome";

        // For each intent
        Object.keys(intents).forEach(function (intent) {

            // Create the intent node
            dialogs.push({
                parent: null,
                conditions: "#" + intent,
                dialog_node: intent,
                previous_sibling: previous_sibling,
                go_to: {
                    selector: "condition",
                    dialog_node: intents[intent]
                }
            })

            // Update the past node's id
            previous_sibling = intent;
        })

        // Agregamos el ultimo nodo: anything_else
        dialogs.push({
            parent: null,
            conditions: "anything_else",
            dialog_node: "Anything Else",
            previous_sibling: previous_sibling,
            output: {
                text: {
                    values: WORKSPACE_ANYTHING_ELSE,
                    selection_policy: "random"
                }
            }
        });

        // Add the branch nodes
        dialogs = dialogs.concat(branch_dialogs);

        // Save the object to a file
        storeAs("dialogs", dialogs);

        // Calls the last function
        generateConversation(callback)
    })
}

/**
 * Generates the conversation object with the intents, entities and dialogs
 * 
 * @param {function} callback callback to return the conversation object
 */
function generateConversation(callback) {

    // Creates the conversation object
    var conversation = {
        name: WORKSPACE_NAME,
        language: WORKSPACE_LANG,
        description: WORKSPACE_DESC,
        intents: intents,
        entities: entities,
        dialog_nodes: dialogs
    }

    // Saves it as a JSON file
    storeAs("conversation", conversation);

    // Sends the conversation object to the callback function
    if (callback != null) callback(conversation)
}