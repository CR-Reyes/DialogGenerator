/**
 * Watson Class
 * 
 * This file provides an interface to the Watson Conversation service
 * 
 * A logging function is available to save the data in a customized way
 */

var ConversationV1 = require('watson-developer-cloud/conversation/v1');

// Watson Class
function Watson(username, password, workspace_id) {
    this.conversation = new ConversationV1({
        username: username,
        password: password,
        version_date: ConversationV1.VERSION_DATE_2017_04_21
    });

    this.workspace_id = workspace_id;

    var log_func = console.log;

    this.override_log = function (log) {
        log_func = log;
    }

    this.getResponse = function (sender, text, context, callback) {

        this.conversation.message({
            input: { text: text },
            workspace_id: this.workspace_id,
            context: context
        }, function (err, response) {
            if (err) {
                console.error(err);
            } else {
                //console.log(JSON.stringify(response, null, 2));
                log_func(response)
                callback(sender, response["output"]["text"].join(" "), response["context"], response);
            }
        });
    }

    this.getWorkspace = function (callback) {
        this.conversation.getWorkspace(
            {
                workspace_id: this.workspace_id,
                export: true
            }, callback);
    }

    this.updateWorkspace = function (params, callback) {
        params.workspace_id = this.workspace_id;
        this.conversation.getWorkspace(params, callback);
    }
}


module.exports = Watson;

var watson = new Watson('00e8112d-4029-454f-a732-fd0771c96776', 'LJhYIuTOIIHG', '804b460d-60aa-4546-b681-89d2e97d6099');
var watson2 = new Watson('00e8112d-4029-454f-a732-fd0771c96776', 'LJhYIuTOIIHG', '22310692-9026-459f-a799-a61a4c9964bc');

// watson.getWorkspace(console.log)

watson.getWorkspace(function (w1p1, w1p2) {
    console.log(JSON.stringify(Object.keys(w1p2)))
    var args = {};
    watson2.getWorkspace(function (w2p1, w2p2) {
        console.log(JSON.stringify(w2p2.dialog_nodes))
        w2p2.dialog_nodes = w1p2.dialog_nodes;
        // console.log(JSON.stringify(w2p2.dialog_nodes))        
        watson2.updateWorkspace(w2p2,console.log)
    });
});