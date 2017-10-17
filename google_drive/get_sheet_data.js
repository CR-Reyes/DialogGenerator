var fs = require('fs');
var google = require('googleapis');
var authorize = require('./google_auth/google_auth.js')


function Get_Sheet_Data(IDs) {

  // Attributes -----------------------------------------------------------------------------

  this.IDs = IDs;
  var CLIENT_SECRET = null;

  // Private functions ----------------------------------------------------------------------

  /**
   * Gets the data from a google sheet
   * 
   * @param {Object} callback {callback: function, spreadsheetId: string, range: string}
   */
  function getData(callback) {
    if (CLIENT_SECRET == null) {

      // Load client secrets from a local file.
      fs.readFile(__dirname + '/google_auth/client_secret.json', function processClientSecrets(err, content) {
        if (err) {
          console.log('Error loading client secret file: ' + err);
          return;
        }

        // Authorize a client with the loaded credentials, then call the
        // Google Sheets API.
        CLIENT_SECRET = JSON.parse(content);
        authorize(CLIENT_SECRET, getSheetData, callback);

      });
    } else {

      // Authorize a client with the loaded credentials, then call the
      // Google Sheets API.
      authorize(CLIENT_SECRET, getSheetData, callback);
    }
  }

  /**
   * Gets the data from the specified spreadsheet and range on the callback Object, and 
   * returns it to the callback function
   * 
   * @param {google.auth.OAuth2} auth 
   * @param {Object} callback {callback: function, spreadsheetId: string, range: string}
   */
  function getSheetData(auth, callback) {

    // Initializes the sheet object
    var sheets = google.sheets('v4');

    // Get request for the values
    sheets.spreadsheets.values.get({
      auth: auth, // google.auth.OAuth2 Object
      spreadsheetId: callback.spreadsheetId, // SpreadSheetId
      range: callback.range, // Rande in the A1 format
    }, function (err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      // returns the response matrix to the callback
      callback.callback(response);
    });
  }

  // Public functions -------------------------------------------------------------------

  /**
   * Gets the entities and send them in an Object to the callback function
   * 
   * @param {function} callback 
   */
  this.getEntities = function (callback) {

    // Function to transform the matrix in an object
    var entities = function (response) {

      // Object to send to the callback
      var values = {};

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the entity, values an synonyms
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var entity = row[0];
          var value = row[1];
          var synonyms = [];
          for (var j = 2; j < row.length; j++) {
            synonyms.push(row[j]);
          }

          // Build the object with value as key
          values[value] = {
            entity: entity,
            synonyms: synonyms
          };
        }
      }

      // Return the values
      callback(values);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.entities,
      range: 'CSV!A2:Z',
      callback: entities
    }

    // Get the data
    getData(callbackObj);
  }

  /**
   * Gets the intents and send them in an Object to the callback function
   * 
   * @param {function} callback 
   */
  this.getIntents = function (callback) {

    // Function to transform the matrix in an object    
    var intents = function (response) {

      // Object to send to the callback
      var intents = {};

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the intents and examples
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var intent = row[1];
          var example = row[0];

          // Initialize intent if null
          if (intents[intent] == null) {
            intents[intent] = {};
            intents[intent].examples = [];
          }

          // Add example to intent
          intents[intent].examples.push(example)
        }
      }

      // Return the values      
      callback(intents);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.intents,
      range: 'CSV!A2:B',
      callback: intents
    }

    // Get the data
    getData(callbackObj);
  }

  /**
    * Gets the tree data and send it in an Object to the callback function
    * 
    * @param {function} callback 
    */
  this.getTree = function (callback) {

    // Function to transform the matrix in an object    
    var tree = function (response) {

      // Object to send to the callback
      var tree = {};

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the id, answer, intents and entities
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var id = row[0];
          var res = row[1];
          var intent = row[2];
          var entities = [];
          for (var j = 3; j < row.length; j++) {
            entities.push(row[j]);
          }

          // Initialize intent branch if null
          if (tree[intent] == null) {
            tree[intent] = {};
          }

          // Create the node
          tree[intent][id] = {};
          tree[intent][id].entities = entities;
          tree[intent][id].response = res;
        }
      }

      // Return the values
      callback(tree);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.answers,
      range: 'Arbol Estatico!A2:Z',
      callback: tree
    }

    // Get the data
    getData(callbackObj);
  }

  /**
   * Gets the templates from the analysis document
   * 
   * @param {function} callback 
   */
  this.getTemplates = function (callback) {

    // Function to transform the matrix in an object    
    var templates = function (response) {

      // Object to send to the callback
      var templates = {};

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the template and intent
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var template = row[0];
          var intent = row[1];

          // Initialize intent branch if null
          if (templates[intent] == null) {
            templates[intent] = [];
          }

          // Add the template
          templates[intent].push(template)
        }
      }

      // Return the values
      callback(templates);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.analysis,
      range: 'Templates!A2:B',
      callback: templates
    }

    // Get the data
    getData(callbackObj);
  }

  /**
   * This function gets the final questions from the Analisis document
   * 
   * @param {function} callback 
   */
  this.getFinals = function (callback) {

    // Function to pass the matrix to an object
    var finals = function (response) {

      // Object to save the questions
      var questions = [];

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the question, entities and intent
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var question = row[0];
          var intent = row[1];

          // Get the entities, filter the empty spaces and sort them
          var entities = row.slice(2).filter(function (entity) {
            return entity != "";
          }).sort(function (a, b) {
            return a.localeCompare(b);
          });

          // Insert the question to the questions
          questions.push({
            question: question,
            intent: intent,
            entities: entities
          });
        }
      }

      callback(questions);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.analysis,
      range: 'Preguntas Finales!C2:Z',
      callback: finals
    }

    // Get the data
    getData(callbackObj);
  }

  /**
   * This function gets the undesired questions from the Analisis document
   * 
   * @param {function} callback 
   */
  this.getUndesired = function (callback) {

    // Function to pass the matrix to an object
    var undesired = function (response) {

      // Object to save the questions
      var questions = [];

      // Get the data matrix
      var rows = response.values;

      // If empty log a warning
      if (rows.length == 0) {
        console.log('No data found.');
      } else {

        // For each row, get the question, entities and intent
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var question = row[0];
          var intent = row[1];

          // Get the entities, filter the empty spaces and sort them
          var entities = row.slice(2).filter(function (entity) {
            return entity != "";
          }).sort(function (a, b) {
            return a.localeCompare(b);
          });

          // Insert the question to the questions
          questions.push({
            question: question,
            intent: intent,
            entities: entities
          });
        }
      }

      callback(questions);
    }

    // Create the callback object
    var callbackObj = {
      spreadsheetId: this.IDs.analysis,
      range: 'Preguntas no deseadas!A2:Z',
      callback: undesired
    }

    // Get the data
    getData(callbackObj);
  }
}

module.exports = Get_Sheet_Data;