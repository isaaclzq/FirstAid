// I used reindeer game as my base reference.
// the following functions are copied without any modification but only serve for basic functionalities
// 1. exports.handler
// 2. buildResponse
// 3. buildSpeechletResponse
// 4. buildSpeechletResponseWithoutCard
// 5. handleFinishSessionRequest


'use strict';

var CPRInstruction = {
    ccBrief: " Now you will give 30 chest compressions.",
    rbBrief: " Now you will give 2 rescue breaths.",
    ready: " when you are ready to begin, say 'ready'.",
    ccDone: " when you are done with 30 compressions, say 'done'. You should follow my rhythm.",
    rbDone: " when you are done with 2 rescue breaths, say 'done'. You may begin.",
    ccDetail : [
        " Pay attention to the following: ",
        " 1. You must lay the person on firm, flat surface.",
        " 2. Push hard, push fast in the middle of the chest at least 2 inches deep and at least 100 compressions per minutes."
    ],
    rbDetail: [
        " Pay attention to the following: ",
        " 1. Tilt the head back and lift the chin up.",
        " 2. Pinch the nose shut then make a complete seal over the person's mouth.",
        " 3. Blow in for about 1 second to make the chest clearly rise.",
        " 4. Give rescue breaths, one after the other.",
        " Note: If chest does not rise with rescue breaths, retilt the head and give another rescue breaths."
    ],
    stopDetail : [
        "You will do cycles of CPR, but you should stop when you encounter one of the following situations:",
        " 1. You find an obvious sign of life, such as breathing.",
        " 2. An AED is ready to use.",
        " 3. Another trained responder or EMS personnel take over.", 
        " 4. You are too exhausted to continue.",
        " 5. The scene becomes unsafe."
    ]
};  
var list_of_items = [
        "Checking an Injured Adult.",
        "Choking.",
        "CPR.",
        "AED.",
        "Controlling Bleeding.",
        "Burns.",
        "Poisoning.",
        "Neck Injuries.",
        "Spinal Injuries.",
        "Stroke.",
    ];

var commandNotFound = "the command is not supported. You can find out what commands are supported by calling 'what can i do'.";
var availCommand = {
    NeedHelpIntent : " i need help with.",
    whatToSayIntent: " what can I say.",
    HowToCPRIntent : " how do I do chest compressions or breaths.",
    restartIntent  : " restart chest compressions or breaths.",
    restartOnlyIntent: " restart.",
    readyIntent    : " ready.",
    doneIntent     : " done.",
    stopIntent     : " stop CPR." 
};


// --------------- constant variables ------------------
var NUMSTEP = 4;
// --------------- constant variables ------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

        if (event.session.application.applicationId !== "amzn1.ask.skill.be0aedf1-ba5f-4094-b0aa-42c4c85a84ff") {
            context.fail("Invalid Application ID");
        }

        // call onSessionStarted, did nothing within the function

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    switch (intentName) {
        case "NeedHelpIntent":
            needHelpRequest (intent, session, callback); break;
        case "readyIntent":
            readyToDoRequest (intent, session, callback); break;
        case "doneIntent":
            doneRequest (intent, session, callback); break;
        case "stopIntent":
            stopRequest (intent, session, callback); break;
        case "HowToCPRIntent":
            howToRequest (intent, session, callback); break;
        case "whatToSayIntent": 
            whatToSayRequest (intent, session, callback); break;
        case "AMAZON.HelpIntent":
            whatToSayRequest (intent, session, callback); break;
        case "AMAZON.YesIntent":
            stopResponse (true, session, callback); break;
        case "AMAZON.NoIntent":
            stopResponse (false, session, callback); break;
        case "AMAZON.StopIntent":
            handleFinishSessionRequest (intent, session, callback); break;
        case "DontKnowIntent":
            whatToSayRequest (intent, session, callback); break;
        case "chokingIntent" :
            chokingResponse (intent, session, callback); break;
        case "restartIntent":
            restart (intent, session, callback); break;
        case "restartOnlyIntent":
            restartOnly (intent, session, callback); break;
        default:
            callback (session.attributes, buildSpeechletResponse(CARD_TITLE, "", "", false));
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

}

// ------- Skill specific business logic -------

var CARD_TITLE = "First Aid"; // Be sure to change this for your skill.

function getWelcomeResponse(callback) {
    var speechOutput = "First Aid here, What can I help you with?",
        shouldEndSession = false;

    var sessionAttributes = {
        needDetail: true,
        curFunction: null,
        prevAnswer: speechOutput,
        stopRequest: false,
    };

    sessionAttributes.command = [availCommand.NeedHelpIntent];
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, shouldEndSession));
}

function overviewRequest (intent, session, callback) {
    var speechOutput = "",
        sessionAttributes = {};

    speechOutput += "Here are the available commands. ";
    for (var item in list_of_items) {
        speechOutput += (parseInt(item)+1).toString() + ". " + list_of_items[item] + " ";
    }
    speechOutput += "And You may start the sentence with I need help with ...";
    sessionAttributes.command = [availCommand.NeedHelpIntent];
    callback(sessionAttributes,
             buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function needHelpRequest (intent, session, callback) {

    if (!session.attributes.command) {
        // exceptions
        throw "needHelpRequest is bad";        
    }

    var speechOutput = "",
        sessionAttributes = {};

    var help = intent.slots.Scenario.value;

    if (isExpected(session, availCommand.NeedHelpIntent)) {
        switch (help) {
            case "CPR":
                for (var insturction in CPRInstruction.stopDetail) {
                    speechOutput += CPRInstruction.stopDetail[insturction];
                } 
                speechOutput += CPRInstruction.ready;
                sessionAttributes.curFunction = "CPR";
                sessionAttributes.needDetail = true;
                sessionAttributes.step = -1;
                sessionAttributes.prevAnswer = speechOutput;
                sessionAttributes.command = [availCommand.readyIntent, availCommand.stopIntent];
                break;
            case "choking":
                speechOutput += " Is the person conscious or unconscious?";
                sessionAttributes.curFunction = "Choking";
                sessionAttributes.prevAnswer = speechOutput;
                sessionAttributes.command = [" conscious.", " unconscious."];
                break;
            default:
                speechOutput += "dial 911.";
                sessionAttributes.command = [availCommand.NeedHelpIntent];
        }        
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    
    callback(sessionAttributes,
             buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function chokingResponse (intent, session, callback) {
    var speechOutput = "",
        sessionAttributes = {};

    if (isExpected(session, " conscious." || isExpected(session, " unconscious."))) {
        speechOutput = "dial 911.";    
        sessionAttributes.curFunction = null;
        sessionAttributes.command = [availCommand.NeedHelpIntent];
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    
    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function isExpected (session, expectation) {
    for (var i in session.attributes.command) {
        if (session.attributes.command[i] == expectation) {
            return true;
        }
    }
    return false;
}

function readyToDoRequest (intent, session, callback) {

    // check if there are commands available

    if (!session.attributes.command) {
        // exceptions
        throw "readyToDoRequest is bad";
    }

    // check input matches with one of available commands

    var sessionAttributes = {},
        speechOutput = "";

    if (isExpected(session, availCommand.readyIntent)) {
        var curStep = session.attributes.step;
        var pauseTime = "<break time=\"1ms\" />";

        switch (curStep) {
            case -1:
                speechOutput = cpr_Step0 (session, sessionAttributes, false);
                break;
            case 0:
                speechOutput += " <speak>";
                speechOutput += cpr_Step1 (session, sessionAttributes, false);
                for (var j = 0; j < 3; j++) {
                    for (var i = 1; i <= 10; i++) {
                        speechOutput += " " + i.toString() + " " + pauseTime;
                    }    
                }
                speechOutput += " </speak>";
                callback (sessionAttributes, buildSpeechletResponseWithBreak(CARD_TITLE, speechOutput, speechOutput, false));
                break;
            case 2:
                speechOutput = cpr_Step3 (session, sessionAttributes, false);
                break;
        }
        
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    callback (sessionAttributes,
                  buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));    
    
}

function doneRequest (intent, session, callback) {

    if (!session.attributes.command) {
        // exceptions
        throw "doneRequest is bad";
    }

    var curStep = session.attributes.step,
        sessionAttributes = {},
        speechOutput = "";

    if (isExpected(session, availCommand.doneIntent)) {
        switch (curStep) {
            case 1:
                speechOutput = cpr_Step2 (session, sessionAttributes, false);
                break;
            case 3:
                speechOutput = cpr_Step0 (session, sessionAttributes, false);
                break;
        }
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}
 
function stopRequest (intent, session, callback) {
    if (!session.attributes.command) {
        // exceptions
        throw "stopRequest is bad";
    }


    var speechOutput = " are you sure you want to stop?",
        sessionAttributes = {};

    if (isExpected(session, availCommand.stopIntent)) {
        sessionAttributes.needDetail = session.attributes.needDetail;
        sessionAttributes.step = session.attributes.step;
        sessionAttributes.prevAnswer = session.attributes.prevAnswer;
        sessionAttributes.stopRequest = true;
        sessionAttributes.curFunction = session.attributes.curFunction;

        sessionAttributes.command = ["Yes.", "No."];
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    
    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function stopResponse (yes, session, callback) {

    if (!session.attributes.command) {
        throw "stopResponse is bad";
    }

    var speechOutput = "",
        sessionAttributes = {},
        exit = false;

    if (isExpected(session, "Yes.") || isExpected(session, "No.")){
        if (session.attributes.curFunction == "CPR") {
            if (yes) {
                // agree to stop
                speechOutput += "CPR stopped.";
                sessionAttributes.command = [availCommand.NeedHelpIntent];
            } else {
                // cancel stopping
                speechOutput += "cancelled stop request.";
                createSession (sessionAttributes, 
                               session.attributes.curFunction,
                               session.attributes.needDetail,
                               session.attributes.step,
                               session.attributes.prevAnswer,
                               session.attributes.stopRequest);
                sessionAttributes.command = [availCommand.HowToCPRIntent, availCommand.restartIntent, availCommand.restartOnlyIntent];
            }
        } else {
            throw "Invalid from stopResponse";
        }
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    
    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, exit));
}

function createSession (sessionAttributes, curFunction, needDetail, step, prevAnswer, stopRequest) {
    sessionAttributes.curFunction = curFunction;
    sessionAttributes.needDetail = needDetail;
    sessionAttributes.step = step;
    sessionAttributes.prevAnswer = prevAnswer;
    sessionAttributes.stopRequest = stopRequest;
}

function restartOnly (intent, session, callback) {

    if (!session.attributes.command) {
        throw "restartOnly is bad";
    }

    var speechOutput = "",
        sessionAttributes = {};

    if (isExpected(session, availCommand.restartOnlyIntent)) {
        speechOutput = cpr_Step0 (session, sessionAttributes, true);
        sessionAttributes.step = 0;     
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }

    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function restart (intent, session, callback) {

    if (!session.attributes.command) {
        throw "restart is bad";
    }

    var speechOutput = "",
        sessionAttributes = {};

    var value = intent.slots.CPR.value;

    if (isExpected(session, availCommand.restartIntent)) {
        if (value == "chest compression") {
            restartOnly (intent, session, callback);
        } else {
            speechOutput = cpr_Step2 (session, sessionAttributes, true);
            sessionAttributes.step = 2;
        }    
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }
    callback (sessionAttributes,
              buildSpeechletResponse(CARD_TITLE, speechOutput, speechOutput, false));
}

function howToRequest (intent, session, callback) {
    var speechOutput = "",
        sessionAttributes = {};


    var value = intent.slots.CPR.value;
    cloneSession (session, sessionAttributes);

    if (isExpected(session, availCommand.HowToCPRIntent)) {
        if (value == "chest compression") {
            for (var index in CPRInstruction.ccDetail) {
                if (index === 0) {
                    continue;
                }   
                speechOutput += CPRInstruction.ccDetail[index];
            }
        } else {
            for (var i in CPRInstruction.rbDetail) {
                if (i === 0) {
                    continue;
                }   
                speechOutput += CPRInstruction.rbDetail[i];
            }
        }    
    } else {
        cloneSession (session, sessionAttributes);
        speechOutput = commandNotFound;
    }

    callback (sessionAttributes,
              buildSpeechletResponse (CARD_TITLE, speechOutput, speechOutput, false));

}


function cloneSession (session, newSession) {
    newSession.curFunction = session.attributes.curFunction;
    newSession.needDetail = session.attributes.needDetail;
    newSession.step = session.attributes.step;
    newSession.prevAnswer = session.attributes.prevAnswer;
    newSession.stopRequest = session.attributes.stopRequest;
    newSession.command = (session.attributes.command).slice(0);
}

function whatToSayRequest (intent, session, callback) {
    var speechOutput = "",
        sessionAttributes = {};

    cloneSession (session, sessionAttributes);

    if (!session.attributes.curFunction){
        overviewRequest (intent, session, callback);
    } else {
        if (!session.attributes.command) {
            speechOutput += "no commands are available.";
        } else {
            speechOutput += "Here are the available commands. ";
            for (var x in session.attributes.command) {
                speechOutput += " " + (parseInt(x)+1).toString() + ". " + session.attributes.command[x];
            }
        }
        callback (sessionAttributes,
                  buildSpeechletResponse (CARD_TITLE, speechOutput, speechOutput, false));
    }
}


// --------------- CPR loop ------------------
function cpr_Step0 (session, newSession, needDetail) {
    var speechOutput = "";

    // fill out the speechout
    speechOutput += CPRInstruction.ccBrief;
    if (session.attributes.needDetail || needDetail) {
        for (var index in CPRInstruction.ccDetail) {
            speechOutput += CPRInstruction.ccDetail[index];
        }
    }
    speechOutput += CPRInstruction.ready;

    // fill out the newSession
    newSession.curFunction = "CPR";
    newSession.needDetail = session.attributes.needDetail;
    newSession.step = (session.attributes.step + 1) % NUMSTEP;
    newSession.prevAnswer = speechOutput;
    newSession.command = [availCommand.readyIntent, availCommand.HowToCPRIntent, availCommand.restartIntent, availCommand.restartOnlyIntent, 
                          availCommand.stopIntent];
    return speechOutput;
}

function cpr_Step1 (session, newSession, needDetail) {
    var speechOutput = "";

    // fill out the speechout
    speechOutput += CPRInstruction.ccDone;

    // fill out the newSession
    newSession.curFunction = "CPR";
    newSession.needDetail = session.attributes.needDetail || needDetail;
    newSession.step = (session.attributes.step + 1) % NUMSTEP;
    newSession.prevAnswer = speechOutput;
    newSession.command = [availCommand.doneIntent, availCommand.HowToCPRIntent, availCommand.restartIntent, availCommand.restartOnlyIntent, 
                          availCommand.stopIntent];

    return speechOutput;
}

function cpr_Step2 (session, newSession, needDetail) {
    var speechOutput = "";

    // fill out the speechout
    speechOutput += CPRInstruction.rbBrief;
    if (session.attributes.needDetail || needDetail) {
        for (var index in CPRInstruction.rbDetail) {
            speechOutput += CPRInstruction.rbDetail[index];
        }
    }
    speechOutput += CPRInstruction.ready;

    // fill out the newSession
    newSession.curFunction = "CPR";
    newSession.needDetail = session.attributes.needDetail || needDetail;
    newSession.step = (session.attributes.step + 1) % NUMSTEP;
    newSession.prevAnswer = speechOutput;
    newSession.command = [availCommand.readyIntent, availCommand.HowToCPRIntent, availCommand.restartIntent, availCommand.restartOnlyIntent, 
                          availCommand.stopIntent];

    return speechOutput;
}

function cpr_Step3 (session, newSession, needDetail) {
    var speechOutput = "";

    // fill out the speechout
    speechOutput += CPRInstruction.rbDone;

    // fill out the newSession
    if (session.attributes.step == 3) {
        newSession.needDetail = false;
    }
    newSession.curFunction = "CPR";
    newSession.step = (session.attributes.step + 1) % NUMSTEP;
    newSession.prevAnswer = speechOutput;
    newSession.command = [availCommand.doneIntent, availCommand.HowToCPRIntent, availCommand.restartIntent, availCommand.restartOnlyIntent, 
                          availCommand.stopIntent];

    return speechOutput;
}
// -------------------------------------------

function handleFinishSessionRequest (intent, session, callback) {
    var sessionAttributes = {},
        speechOutput = "Good bye!";
    callback({}, 
             buildSpeechletResponseWithoutCard(speechOutput, "", true));
}

// ------- Helper functions to build responses -------

function buildSpeechletResponseWithBreak (title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "SSML",
            ssml: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "SSML",
                ssml: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

