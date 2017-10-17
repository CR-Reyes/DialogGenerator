# Create Dialog - Documentation

This document will serve as a user guide to 
generate the JSON File required by IBM Watson Conversation.

### Step 0: Review the structure of the Google Sheets Files

1. **Intents File** 
    * You must have a sheet called ***CSV***, review the template to build that sheet.

2. **Entities File**
    * You must have a sheet called ***CSV***, review the template to build that sheet. 

3. **Answers File**
    * You must have a sheet called ***Arbol Estadistico***, review the template to build that sheet. 

### Step 1: File - create_dialog.js

1. Replace the sheets' ID of the entities, intents and answers files.
    * To get the ID you should open the Google Sheets File and in the URL you will find the ID: https://docs.google.com/spreadsheets/d/***1qpyC0XzvTcKT6EISywvqESX3A0MwQoFDE8p-Bll4hps***/edit#gid=0 

    * You should replace the IDs in the code:
        ```js
        var getSheetData = new GetSheetData({
            entities: 'IDEntitiesFile',
            intents: 'IDIntentsFile',
            answers: 'IDAnswersFile'
        });
        ```

### Step 2: Get the credentials for Google Sheets API

New Project:
1. Go to [Google APIs](https://console.developers.google.com/flows/enableapi?apiid=sheets.googleapis.com).
2. Create a project and in the following dialog click ***Go to credentials*** button, and finally click the ***Cancel*** button. 
3. Select ***OAuth consent screen*** tab. Select an Email address, enter a Product name, and finally click the ***Save*** button.
4. Select the ***Credentials*** tab, click the ***Create credentials*** button and select ***OAuth client ID***.
5. Select the application type ***Other***, enter the name ***Google Sheets API Quickstart***, and click the ***Create button***. Finally click ***OK*** to dismiss the resulting dialog.
6. Click the ***File Download Icon*** button to the right of the client ID.
7. Replace the credentials in the file ***client_secret.json***.

Existing Project:
1. Go to [Google APIs](https://console.developers.google.com/apis/credentials) and select your project, you will find the list of projects next to ***Google APIs logo***. 
3. Click the ***File Download Icon*** button to the right of the client ID.
4. Replace the credentials in the file ***client_secret.json***.

> For more information about ***Google_auth.js*** and the ***credentials*** visit [Google Sheets API for Node.js](https://developers.google.com/sheets/api/quickstart/nodejs).

### Step 3: Run the code

0. You must install the modules ***googleapis*** and ***google-auth-library*** in ***utils***, to do this run the next command in the terminal.

    ```
    npm install googleapis
    np, install google-auth-library
    ```

1. In the terminal go to the directory where is the script ***create_dialog.js*** and run the next command.

    ```
    node create_dialog.js
    ```

    Note: You will need to authorize the app, to do this visit the given URL and copy and paste the code from that page.

2. Finally, in the ***output*** directory you will find the file ***conversation.json***. 