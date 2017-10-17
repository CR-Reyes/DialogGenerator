/**
* Function for testing purposes
*/
function main() {
    //  Logger.log(RANGE_TO_COLUMN("Analisis!D2:I"));
    //  Logger.log(CREATE_TEMPLATES("Analisis!B2:I"));
    Logger.log(ANALISIS_QUESTIONS("Preguntas Finales!C2:Z", "https://docs.google.com/spreadsheets/d/1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM/edit", "CSV!A2:B", "https://docs.google.com/spreadsheets/d/1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM/edit", "CSV!A2:Z"));
    //  Logger.log(ANALISIS_STATUS("B2:I", "https://docs.google.com/spreadsheets/d/1SNG4-S6nGopUvaGRcgEN0MwD2G_SdgYvcG5t2B-sWpM/edit",
    //    "CSV!A2:B", "https://docs.google.com/spreadsheets/d/1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM/edit", "CSV!A2:Z"));
    //  Logger.log(PREGUNTAS_SUGERIDAS("Plantillas Unicas Preguntas!$A$2:Z", "https://docs.google.com/spreadsheets/d/1yZiiyC9p-gr-TvminO1wMQCruch_nN8S3DT3Vh6d8nM/edit", "CSV!$A$2:Z", "0.283673962"));
}

/**
* Function to update the diferent functions on the analysis file
* 
* @param {Event} e 
*/
function onEdit(e) {

    // Only update qhen info is edited
    if (e.range.getSheet().getName() == "Info") {

        // Update the functions on each file
        e.range.getSheet().getParent().getSheets().forEach(function (sheet) {
            if (sheet.getName() == "Analisis") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=ANALISIS_STATUS("$B$2:$Z"; Info!B13; "CSV!A2:B"; Info!B14; "CSV!A2:Z"; "' + Math.random() + '")');
            } else if (sheet.getName() == "Templates") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=CREATE_TEMPLATES("Analisis!B2:Z"; "' + Math.random() + '")');
            } else if (sheet.getName() == "Entities") {
                sheet.getRange("A:A").getCell(2, 1).setValue('=SORT(UNIQUE(RANGE_TO_COLUMN("Analisis!D2:Z"; "' + Math.random() + '")))');
            }
        });
    }
}

/**
* This functions converts a range matrix into a column
* 
* @param {string} rangeA1 Range to convert into a column
* @param {*} updateParam value to change to update the result of the function
*/
function RANGE_TO_COLUMN(rangeA1, updateParam) {

    // Get the values from the range of the sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeA1);
    var values = range.getDisplayValues();

    // Concatenate each row to the response array
    var response = [];
    for (var i = 0; i < values.length; i++) {
        response = response.concat(values[i]);
    }

    // return the result
    return response;
}

/**
* Function that creates the templates out of the questions and specified entities 
* 
* @param {string} rangeA1 range of the questions, intents and entities to be parsed
* @param {*} updateParam value to be changed when the function result needs to update
*/
function CREATE_TEMPLATES(rangeA1, updateParam) {

    // Get the values from the range 
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeA1);
    var values = range.getDisplayValues();

    // Response array to saved the parsed templates
    var response = [];

    // For each question, create a template
    for (var i = 0; i < values.length; i++) {

        // Make sure there is a question to begin with
        var value = values[i];
        if (value[0] == "") break; // End the process if no question

        // For each entity value, change the value to "[Entity]"
        for (var j = 2; j < value.length; j++) {
            if (value[j] == "") break; // If no more values, break the loop
            // Create the alphanumeric check regex
            var letterNumber = /^[0-9a-zA-Z ]+$/;
            var val = value[j];


            // If value is not alphanumeric, do a string search, if not, do a regex search
            if (!val.match(letterNumber)) {

                // Divide de non alphanumeric values from the alphanumerics
                var regex = /[^0-9a-zA-Z ]/g;
                var invalids = val.match(regex);
                var valids = val.split(regex);

                // Add the escape character the non alphanumeric
                val = valids[0];
                for (var k = 0; k < invalids.length; k++) {
                    val += "\\" + invalids[k] + valids[k + 1];
                }

                // Replace the value
                value[0] = value[0].replace(new RegExp(val), "[Entity]");

            } else {

                // Replace the value by word delimited search
                value[0] = value[0].replace(new RegExp('\\b' + val + '\\b'), "[Entity]");
            }
        }

        // Add the template to the response
        response.push(value);
    }

    // Sort the templates by intent and then by template
    response.sort(function (a, b) {
        return (a[1].localeCompare(b[1]) == 0) ? a[0].localeCompare(b[0]) : a[1].localeCompare(b[1]);
    })

    // Return the result
    return response;
}

/**
* Function to check if the analyzed questions have been done correctly. 
* 
* @param {string} rangeA1 range of the values to analyze
* @param {string} intentsSheet url to the intents sheet
* @param {string} intentsA1 range of the intents in the intents sheet
* @param {string} entitiesSheet url to the entities sheet
* @param {string} entitiesA1 range to the entities, values and synonyms
* @param {*} updateParam random value to update the result
*/
function ANALISIS_STATUS(rangeA1, intentsSheet, intentsA1, entitiesSheet, entitiesA1, updateParam) {

    // Get the values of the analisis sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeA1);
    var values = range.getDisplayValues();

    // Prepare the response array
    var response = [];

    // Get the existing intents
    var iss = SpreadsheetApp.openByUrl(intentsSheet);
    var irange = iss.getRange(intentsA1);
    var ivalues = irange.getDisplayValues();

    // Save the intents in a hashmap
    var intents = {};
    for (var i = 0; i < ivalues.length; i++) {
        intents[ivalues[i][1]] = true;
    }

    // Register if the intent wasn't found in the existing intents
    for (var i = 0; i < values.length; i++) {

        // Break the loop if no more questions
        if (values[i][0] == "") break;

        response[i] = [];
        if (values[i][1] != "") {
            if (intents[values[i][1]] == null) {
                response[i].push("Intent not found: " + values[i][1]);
            }
        }
    }

    // Get the entities with values and synonims
    var ess = SpreadsheetApp.openByUrl(entitiesSheet);
    var erange = ess.getRange(entitiesA1);
    var eevalues = erange.getDisplayValues();

    // Pass the values to an array
    var evalues = [];
    for (var i = 0; i < eevalues.length; i++) {
        evalues = evalues.concat(eevalues[i]);
    }

    // Pass the array to a hashmap
    var entities = {};
    for (var i = 0; i < evalues.length; i++) {
        entities[evalues[i]] = true;
    }

    // For each question
    for (var i = 0; i < values.length; i++) {

        // Break the loop if no more questions
        if (values[i][0] == "") break;

        // For each entity
        for (var j = 2; j < values[i].length; j++) {

            // Break the loop if no more entities
            if (values[i][j] == "") break;

            // If the value wasnt found on the hashmap, log error
            if (entities[values[i][j]] == null) {
                response[i].push("Value not found: " + values[i][j])
            } else {

                // Else, check for the value in the question
                var val = -1; // Initialize the search index
                var letterNumber = /^[0-9a-zA-Z ]+$/; // Create the alphanumeric check regex
                var value = values[i][j];
                var value_regex = new RegExp("");

                // If value is not alphanumeric, do a string search, if not, do a regex search
                if (!value.match(letterNumber)) {

                    // Divide de non alphanumeric values from the alphanumerics
                    var regex = /[^0-9a-zA-Z ]/g;
                    var invalids = value.match(regex);
                    var valids = value.split(regex);

                    // Add the escape character the non alphanumeric
                    value = valids[0];
                    for (var k = 0; k < invalids.length; k++) {
                        value += "\\" + invalids[k] + valids[k + 1];
                    }

                    // Create the regular expression
                    value_regex = new RegExp(value);

                } else {

                    // Create the regular expresion limited by word
                    value_regex = new RegExp("\\b" + value + "\\b");
                }

                // Search for the expresion
                val = values[i][0].search(value_regex);
                // If not in question, log error
                if (val == -1) {
                    response[i].push("Not in example: " + values[i][j]);
                }
            }
        }
    }

    // Check if everything is in order
    var ok = true;
    response.forEach(function (val) {
        if (val.length > 0) ok = false;
    });

    // If there is an error, parse every case
    if (!ok) {
        for (var i = 0; i < response.length; i++) {
            if (response.length > 1) {
                // Join the error logs by a coma
                response[i] = response[i].reduce(function (total, res) {
                    return total + ", " + res;
                }, []);
            }
        }
    }

    // If no errors, respond OK
    if (ok) response = "OK";

    // return the result
    return response;
}

// --------------------------------------------------------------------------------------------- Beta functions

/**
* Checks the final questions range for errors
* 
* @param {string} rangeA1 range to evaluate (question, intent, entities)
* @param {string} intentsSheet url to the intents sheet
* @param {string} intentsA1 range of the existeing intents
* @param {string} entitiesSheet url to the existing entities
* @param {string} entitiesA1 range of the entities, values and synonyms
* @param {*} updateParam parameter to change when the result needs tu update
*/
function ANALISIS_QUESTIONS(rangeA1, intentsSheet, intentsA1, entitiesSheet, entitiesA1, updateParam) {

    // Get the values of the final questions
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeA1);
    var values = range.getDisplayValues();

    // Create response array
    var response = [];

    // Get the values of the intents
    var iss = SpreadsheetApp.openByUrl(intentsSheet);
    var irange = iss.getRange(intentsA1);
    var ivalues = irange.getDisplayValues();

    // Create the intent hashset
    var intents = {};
    for (var i = 0; i < ivalues.length; i++) {
        intents[ivalues[i][1]] = true;
    }

    // Check if intent exists
    for (var i = 0; i < values.length; i++) {

        // Initialize the response for the question 
        response[i] = [];


        if (values[i][1] != "") {
            // Log error if intent does not exists
            if (intents[values[i][1]] == null) {
                response[i].push("Intent not found: " + values[i][1]);
            }
        }
    }

    // Get the entities, values and synonyms
    var ess = SpreadsheetApp.openByUrl(entitiesSheet);
    var erange = ess.getRange(entitiesA1);
    var eevalues = erange.getDisplayValues();

    // Create the values array, categories hasmap and synonyms hashmap
    var evalues = [];
    var categories = {};
    var synonyms = {};

    // Pass the matrix to a single column
    for (var i = 0; i < eevalues.length; i++) {
        evalues = evalues.concat(eevalues[i]);
    }

    // Save the synonims for the value and the value for the synonyms
    for (var i = 0; i < eevalues.length; i++) {
        synonyms[eevalues[i][1]] = [];
        for (var j = 1; j < eevalues[i].length; j++) {
            categories[eevalues[i][j]] = eevalues[i][1];
            synonyms[eevalues[i][1]].push(eevalues[i][j]);
        }
    }

    // Create a value and synonyms hashmap
    var entities = {};
    for (var i = 0; i < evalues.length; i++) {
        entities[evalues[i]] = true;
    }

    // For each row
    for (var i = 0; i < values.length; i++) {
        if (values[i][0] == "") break; // break if no more questions

        // Check each value
        for (var j = 2; j < values[i].length; j++) {
            if (values[i][j] == "") break; // break loop if no more entities

            // If a synonym wasn't even found
            if (entities[values[i][j]] == null) {
                response[i].push("Value not found: " + values[i][j])

            } else if (categories[values[i][j]] != values[i][j]) {
                // Else if the value is not the representative value
                response[i].push("Synonym not value: " + values[i][j] + ": " + categories[values[i][j]])

            } else {
                // Check if the value's synonym is in the question
                var val = -1;

                // For each of the synonyms
                for (var k = 0; k < synonyms[categories[values[i][j]]].length; k++) {

                    // Get the value
                    var ent = synonyms[categories[values[i][j]]][k];
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
                        for (var k = 0; k < invalids.length; k++) {
                            ent += "\\" + invalids[k] + valids[k + 1];
                        }

                        // Create the regex
                        ent_regex = new RegExp(ent);

                    } else {

                        // Create the regex with alphanumerics
                        ent_regex = new RegExp('\\b' + ent + '\\b');
                    }

                    // Search for the value in the question
                    val = values[i][0].search(ent_regex);

                    // If found, break the loop
                    if (val >= 0) break;
                }

                // If not found in any, log error
                if (val == -1) {
                    response[i].push("Not in example: " + values[i][j]);
                }
            }
        }
    }

    // Check if there was any error
    var ok = true;
    response.forEach(function (val) {
        if (val.length > 0) ok = false;
    });

    // If there was an error, parse the answer from arrays to string for each question
    if (!ok) {
        for (var i = 0; i < response.length; i++) {
            if (response.length > 1) {
                response[i] = response[i].reduce(function (total, res) {
                    return total + ", " + res;
                }, []);
            }
        }
    }

    // If there was no error, return OK
    if (ok) response = "OK";

    // Return the response
    return response;
}

// Codigo CARLOS
function CREATE_CATEGORY_TEMPLATES(rangeQuestions, linkEntities, rangeEntities, updateParam) {

    // Obtiene las preguntas del archivo Analisis/Preguntas Finales
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var values = range.getDisplayValues();

    // Obtiene las entities del archivo Entities/CSV
    var ess = SpreadsheetApp.openByUrl(linkEntities);
    var erange = ess.getRange(rangeEntities);
    var evalues = erange.getDisplayValues();

    var response = [];

    // Values: Lista de preguntas
    // Value: Pregunta seleccionada de Values


    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value[0] == "") break;
        // Lee las entities de la pregunta
        for (var j = 2; j < value.length; j++) {
            if (value[j] == "") break;
            // Lee las entidades en el archivo Entities/CSV
            for (var k = 0; k < evalues.length; k++) {
                var evalue = evalues[k];
                if (evalue[1] == "") break;
                for (var x = 1; x < 5; x++) {
                    if (evalue[x] == value[j]) {
                        value[0] = value[0].replace(" " + evalue[x], " [" + evalue[0] + "]");
                    }
                }
            }
        }
        response.push(value);
    }

    response.sort(function (a, b) {
        return (a[1].localeCompare(b[1]) == 0) ? a[0].localeCompare(b[0]) : a[1].localeCompare(b[1]);
    })

    return response;
}

function createRegExp(entity) {
    var regExp;
    var letterNumber = /^[0-9a-zA-Z ]+$/;

    if (!entity.match(letterNumber)) {
        regExp = " " + entity + " ";
    } else {
        regExp = new RegExp('(\\b' + entity + '\\b)' + '(?![^\[]*\])');
    }

    return regExp;
}

// Genera las templates de las preguntas
function CREATE_CATEGORY_TEMPLATES_2(rangeQuestions, linkEntities, rangeEntities, updateParam) {

    // Obtiene las preguntas del archivo Analisis/Preguntas Finales
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var listaPreguntas = range.getDisplayValues();

    // Obtiene las entities del archivo Entities/CSV
    var ess = SpreadsheetApp.openByUrl(linkEntities);
    var erange = ess.getRange(rangeEntities);
    var listaEntidades = erange.getDisplayValues();

    var entities = {};
    var response = [];

    // Lee las entidades del archivo Entities/CSV
    for (var i = 0; i < listaEntidades.length; i++) {

        var entity = listaEntidades[i];
        if (entity[0] == "") break;

        var myEntity = entity[0];
        var myEntityValue = entity[1];
        var myEntitySynonyms = [];

        for (var j = 2; j < entity.length; j++) {
            if (entity[j] == "") break;
            myEntitySynonyms.push(entity[j]);
        }

        entities[myEntityValue] = {
            entity: myEntity,
            synonyms: myEntitySynonyms
        };
    }

    // Lee las preguntas
    for (var i = 0; i < listaPreguntas.length; i++) {

        var pregunta = listaPreguntas[i];
        if (pregunta[0] == "") break;

        // Lee los values de la pregunta
        for (var j = 2; j < pregunta.length; j++) {

            if (pregunta[j] == "") break;

            var value = pregunta[j];
            var regExp = createRegExp(value);
            var entity = entities[value].entity;

            // Si value esta definido en la pregunta
            if (pregunta[0].search(regExp) >= 0) {
                pregunta[0] = pregunta[0].replace(regExp, '[' + entity + ']');
            } else {
                // Si un sinonimo de value esta definido en la pregunta
                var arraySynonyms = entities[value].synonyms;

                // Buscar cual es el sinonimo definido
                for (var k = 0; k <= arraySynonyms.length; k++) {
                    regExp = createRegExp(arraySynonyms[k]);
                    if (pregunta[0].search(regExp) >= 0) {
                        pregunta[0] = pregunta[0].replace(regExp, '[' + entity + ']');
                        break;
                    }
                }
            }
        }

        response.push(pregunta);
    }

    response.sort(function (a, b) {
        return (a[1].localeCompare(b[1]) == 0) ? a[0].localeCompare(b[0]) : a[1].localeCompare(b[1]);
    })

    return response;
}

// Selecciona las templates unicas
function SELECT_UNIQUE_TEMPLATES(rangeQuestions, updateParam) {

    // Obtiene las preguntas del archivo Analisis/Plantillas Preguntas
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var listaPreguntas = range.getDisplayValues();

    var response = [];
    var preguntas = {};

    // Lee las preguntas
    for (var i = 0; i < listaPreguntas.length; i++) {
        var pregunta = listaPreguntas[i][0];
        var intent = listaPreguntas[i][1];
        var preguntaLlave = "";

        var preguntaEntities = pregunta.match(/\[[a-zA-Z0-9-]+\]/g);
        if (preguntaEntities != null) {
            preguntaLlave = preguntaEntities.join('') + intent;
        }

        if (preguntaLlave != "") {

            if (!(preguntaLlave in preguntas)) {
                var preguntaObjeto = {};
                preguntaObjeto["pregunta"] = preguntaEntities.join('');
                preguntaObjeto["intent"] = intent;
                preguntasco[preguntaLlave] = preguntaObjeto;

                var renglon = [];
                renglon.push(preguntaEntities.join(''));
                renglon.push(intent);
                response.push(renglon);
            }
        }
    }

    return response;
}

// Genera combinaciones 
function PREGUNTAS_SUGERIDAS(rangeQuestions, linkEntities, rangeEntities, updateParam) {

    var response = [];
    var entities = {}; // entidad: [valor1, valor2, valor3]
    var preguntas = {}; // templatePregunta: [entidad1, entidad2, entidad3]
    var combinacionesNumericas = {};
    var combinaciones = {};

    // Obtiene las preguntas del archivo Analisis/Plantillas Unicas Preguntas
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var listaPreguntas = range.getDisplayValues();

    // Obtiene las entities del archivo Entities/CSV
    var ess = SpreadsheetApp.openByUrl(linkEntities);
    var erange = ess.getRange(rangeEntities);
    var listaEntidades = erange.getDisplayValues();

    // Lee las entidades
    for (var i = 0; i < listaEntidades.length; i++) {

        var entity = listaEntidades[i];
        if (entity[0] == "") break;

        var myEntity = entity[0];
        var myEntityValues = []

        if (!(myEntity in entities)) {
            myEntityValues.push(entity[1]);
            entities[myEntity] = myEntityValues;
        } else {
            entities[myEntity].push(entity[1]);
        }
    }

    // Lee las preguntas
    for (var i = 0; i < listaPreguntas.length; i++) {
        var preguntaTemplate = listaPreguntas[i][0];

        var entA = preguntaTemplate.match(/\[[a-zA-Z0-9-]+\]/g);
        var entB = [];

        if (entA != null) {
            for (var j = 0; j < entA.length; j++) {
                var entity = entA[j];
                entity = entity.replace('[', '');
                entity = entity.replace(']', '');
                entB.push(entity);
            }

            preguntas[preguntaTemplate] = entB;

            var llave = "";
            for (var j = 0; j < entB.length; j++) {
                llave += entities[entB[j]].length + '/';
            }

            llave = llave.substring(0, llave.length - 1);
            if (!(llave in combinacionesNumericas)) {
                combinacionesNumericas[llave] = [];
            }

            /*var llave2 = entB.join('&');
            if(!(llave2 in combinaciones)) {
            combinaciones[llave2] = [];
            }*/

        }
    }

    var llaves = Object.keys(combinacionesNumericas);
    for (var i = 0; i < llaves.length; i++) {
        response.push(llaves[i] + ' _ ' + llaves[i].split('/').map(Number));
    }

    /*var llaves = Object.keys(combinaciones);
    for(var i = 0; i < llaves.length; i++) {
    response.push(llaves[i] + ' _ ' +  llaves[i].split('&').length );
    }*/

    return response;
}


function COUNT_ENTITY(rangeQuestions, entity, updateParam) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var values = range.getDisplayValues();

    var counter = 0;

    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value[0] == "") break;
        if (value[0].indexOf(entity) >= 0) {
            counter++;
        }
    }

    return counter;
}

function COUNTUNIQUE_ENTITY(rangeQuestions, entity, updateParam) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var range = ss.getRange(rangeQuestions);
    var values = range.getDisplayValues();

    var counter = 0;

    for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (value[0] == "") break;
        if (value[0].indexOf(entity) >= 0) {
            var newValue = value[0].replace("[" + entity + "]", " ");
            if (newValue.indexOf("[") < 0) {
                counter++;
            }
        }
    }

    return counter;
}