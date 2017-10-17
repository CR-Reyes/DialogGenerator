/**
 * Entity (Category) Templates
 * 
 * This file will create the templates by entity and intent. This will provide a basis for the generation of new questions
 * 
 */

// Get the class to access the data
var GetSheetData = require('../../utils/google_drive/get_sheet_data.js')
var clone = require('clone-deep');
var fs = require('fs');

// Initialize the object
var getSheetData = new GetSheetData({
    entities: '1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM',
    intents: '1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM',
    analysis: '1Jax1niDL-sbNRUHCBxMlwflwCbfHBHfbUYRfhRssaDQ'
});

// Global variables to save the questions
var finals = [];
var undesired = [];
var values = {};
var categories = {};
var templates = {};
var desired_questions = {};
var undesired_questions = {};
var error_log = [];

// Get the data
getSheetData.getFinals(function (f) {
    finals = f;
    console.log("Fetched finals");
    getSheetData.getUndesired(function (u) {
        undesired = u;
        console.log("Fetched Undesired");
        getSheetData.getEntities(function (e) {
            values = e;

            Object.keys(values).forEach(function (value) {
                if (categories[values[value].entity] == null) categories[values[value].entity] = [];

                categories[values[value].entity].push(value);
            })

            console.log("Fetched finals");

            // Just add the entity value as a synonym
            Object.keys(values).forEach(function (value) {
                values[value].synonyms.push(value);
            })

            createTemplates();
        })
    })
})

function createTemplates() {

    // For each of the finals, create a template
    for (var i = 0; i < finals.length; i++) {

        var question = finals[i];

        // Create an identifier
        var id = question.intent + "+" + question.entities.reduce(function (ents, ent) {
            return ents + values[ent].entity + "+";
        }, "");

        // Mark this question as undesired because we don't want to suggest it again
        var id_by_values = question.intent + "+" + question.entities.reduce(function (ents, ent) {
            return ents + ent + "+";
        }, "");
        undesired_questions[id_by_values] = true;

        // Initialize the template
        var template = question.question;

        // Change the entity values by the key "['value']" where the value is explicit
        question.entities.forEach(function (value) {
            if (values[value] == null) {
                error_log.push(value + " does not exist as value, row " + (i + 2))
            } else {

                // Check if the value's synonym is in the question
                var val = -1;

                // For each of the synonyms
                for (var k = 0; k < values[value].synonyms.length; k++) {

                    // Get the value
                    var ent = values[value].synonyms[k];
                    if (ent == "") break; // exit if no more synonyms

                    var letterNumber = /^[0-9a-zA-Z ]+$/;
                    var ent_regex;

                    // Check if value is alphanumeric
                    if (!ent.match(letterNumber)) {
                        // Divide de non alphanumeric values from the alphanumerics
                        var regex = /[^0-9a-zA-Z ]/g;
                        var invalids = ent.match(regex);
                        var valids = ent.split(regex);

                        // Add the escape character the non alphanumeric
                        ent = valids[0];
                        for (var l = 0; l < invalids.length; l++) {
                            ent += "\\" + invalids[l] + valids[l + 1];
                        }

                        // Create the regex
                        ent_regex = new RegExp('[^\\[]' + ent);

                    } else {

                        // Create the regex with alphanumerics
                        ent_regex = new RegExp('\\b[\^\\[]' + ent + '\\b');
                    }

                    // Search for the value in the question
                    val = template.search(ent_regex);

                    // If found, break the loop
                    if (val >= 0) {
                        template = template.replace(ent_regex, " [" + values[value].entity + "]");
                        break;
                    }
                }

                // If not found in any, log error
                if (val == -1) {
                    error_log.push(value + "not in example, row " + (i + 2))
                }
            }
        });

        // Initialize the array for templates by id
        if (templates[id] == null) templates[id] = [];

        // Add the template with the id
        templates[id].push({
            template: template,
            entities: question.entities,
            intent: question.intent
        });
    }

    // Move to the next phase
    createQuestions();
}

function createQuestions() {

    // console.log(JSON.stringify(templates, null, '\t'));

    var combinations = {};

    undesired.forEach(function (question) {

        // Create an identifier
        var id = question.intent + "+" + question.entities.reduce(function (ents, ent) {
            return ents + ent + "+";
        }, "");

        // Add the undesired question
        undesired_questions[id] = true;

    });

    // For each template
    Object.keys(templates).forEach(function (id) {

        templates[id].forEach(function (template) {

            var entities = id.split("+").slice(1, -1);

            for (var i = 0; i < entities.length; i++) {
                entities[i] = {
                    entity: entities[i],
                    values: categories[entities[i]]
                };
            }

            combinations[template.template] = {
                entities: entities,
                intent: template.intent
            }
        })

    });

    // console.log(JSON.stringify(combinations, null, '\t'));
    // console.log(JSON.stringify(undesired_questions, null, '\t'));

    Object.keys(combinations).forEach(function (id) {
        // console.log(combinations[id])
        // console.log(id)
        var combs = [[]];

        // console.log(combinations[id].entities.length);
        if (combinations[id].entities.length < 3) {

            combinations[id].entities.forEach(function (entity) {

                var temp_combs = clone(combs);

                // console.log(JSON.stringify("\t" + entity.values.length))
                entity.values.forEach(function (value) {
                    if (temp_combs[0].length == 0) {
                        temp_combs = combs.map(function (comb) {
                            return comb.concat({ entity: entity.entity, value: value })
                        });
                    } else {
                        temp_combs = temp_combs.concat(combs.map(function (comb) {
                            return comb.concat({ entity: entity.entity, value: value })
                        }));
                    }
                    // console.log(temp_combs.length)
                })

                combs = clone(temp_combs);
            })

            // console.log(JSON.stringify(combs, null, "\t"))

            combs.forEach(function (combination) {
                combination.sort(function (a, b) {
                    return a.value.localeCompare(b.value)
                });

                var value_id = combinations[id].intent + "+" + combination.reduce(function (ents, ent) {
                    return ents + ent.value + "+";
                }, "");

                if (undesired_questions[value_id] == null) {

                    var template = id;

                    combination.forEach(function (value) {
                        template = template.replace("[" + value.entity + "]", value.value)
                    })

                    desired_questions[template] = {
                        intent: combinations[id].intent,
                        entities: combination.map(function (value) {
                            return value.value;
                        })
                    }
                }
            })

        }
    });

    // console.log(JSON.stringify(desired_questions, null, "\t"))

    var desired = [];
    Object.keys(desired_questions).forEach(function (template) {
        desired.push("\"" + template + "\"," + desired_questions[template].intent + ","
            + desired_questions[template].entities.reduce(function (ents, ent) {
                return ents + ent + ",";
            }, ""))
    })

    // console.log(JSON.stringify(desired, null, " "));
    fs.writeFile(__dirname + "/output/desired.csv", JSON.stringify(desired, null, " "));
}
