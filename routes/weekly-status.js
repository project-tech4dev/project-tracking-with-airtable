const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const callNodeMail = require('../config/mail');
var transporter = callNodeMail;
var moment = require('moment');

router.get('', (req, res, next) => {
    const baseTemplate = `<html>
        <head>
            <title>Weekly Status</title>
        </head>
        <body>
            <h2>Weekly Status</h2>
            <ul>
                <li>
                    <a href='/weeklystatus/fridayreminder'>
                        Send Friday Reminder
                    </a>
                </li>
                <li>
                    <a href='/weeklystatus/mondayreminder'>
                        Send Monday Reminder
                    </a>
                </li>
                <li>
                    <a href='/weeklystatus/wednesdayreminder'>
                        Send Wednesday Reminder
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
    res.status(200).end(baseTemplate);
});
router.get('/fridayreminder', (req, res, next) => {
    // fetch all the active projects
    var partnerPoc = [];
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
        // Selecting the first 25 records in Main View:
        view: "Active Projects Poc"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            var projectName = record.get('Project Name');
            var pocs = record.get('Partner PoC');
            partnerPoc.push({ 'Project Name': projectName, 'Partner Poc': pocs });
        });
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    }, function done(err) {
        if (err) {
            console.error(err);
            return;
        } else {
            var projectPocDetails = [];
            var i = 0;
            var j = 0;
            // find the partner poc for active projects
            partnerPoc.forEach(function (pocs, index) {
                var projectName = pocs['Project Name'];
                var partnerPocs = pocs['Partner Poc'];
                var pocArray = [];
                i = i + partnerPocs.length;
                // find the partner poc for active projects
                projectPocDetails.push({ 'Project Name': projectName, 'Partner Poc': pocArray, 'activity exists': false });
                partnerPocs.forEach(function (partnerPoc) {
                    base('Contacts').find(partnerPoc, function (err, record) {
                        j = j + 1;
                        if (err) {
                            console.error(err);
                            return;
                        } else {
                            projectPocDetails.forEach(function (projectPocDetail) {
                                if (projectName == projectPocDetail['Project Name']) {
                                    var contactName = record.get('Name');
                                    var contactEmail = record.get('Email');
                                    projectPocDetail['Partner Poc'].push({ 'Name': contactName, 'Email': contactEmail });
                                }
                            });
                        }
                        if (i == j) {
                            var today = new Date();
                            var currentDate = Date.now();
                            var previousDate = today.setDate(today.getDate() - 4);
                            var formattedDate = moment(currentDate).format('MMM-DD');
                            var previousFormatteddate = moment(previousDate).format('MMM-DD');
                            var fridayMsg = "This is a gentle reminder to fill the weekly project status report for the work done during the period: " + previousFormatteddate + " to " + formattedDate + " by Monday for the project ";
                            getPocEmailId(projectPocDetails, fridayMsg);
                            res.status(200).end("Friday reminder sent successfully!");
                        }
                    });
                });
            });
        }
    });
});
router.get('/mondayreminder', (req, res, next) => {
    // fetch all the active projects
    // find the partner poc for active projects
    // fetch all the active projects
    var partnerPoc = [];
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
        // Selecting the first 25 records in Main View:
        view: "Active Projects Poc"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            //record.get('Partner PoC');
            var projectID = record.id;
            var projectName = record.get('Project Name');
            var pocs = record.get('Partner PoC');
            partnerPoc.push({ 'Project ID': projectID, 'Project Name': projectName, 'Partner Poc': pocs });
        });
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    }, function done(err) {
        if (err) {
            console.error(err);
            return;
        } else {
            var projectPocDetails = [];
            var i = 0;
            var j = 0;
            partnerPoc.forEach(function (pocs, index) {
                var projectID = pocs['Project ID'];
                var projectName = pocs['Project Name'];
                var partnerPocs = pocs['Partner Poc'];
                var pocArray = [];
                i = i + partnerPocs.length;
                // find the partner poc for active projects
                projectPocDetails.push({ 'Project ID': projectID, 'Project Name': projectName, 'Partner Poc': pocArray, 'activity exists': false });
                partnerPocs.forEach(function (partnerPoc) {
                    base('Contacts').find(partnerPoc, function (err, record) {
                        j = j + 1;
                        if (err) {
                            console.error(err);
                            return;
                        } else {
                            projectPocDetails.forEach(function (projectPocDetail) {
                                if (projectName == projectPocDetail['Project Name']) {
                                    var contactName = record.get('Name');
                                    var contactEmail = record.get('Email');
                                    projectPocDetail['Partner Poc'].push({ 'Name': contactName, 'Email': contactEmail });
                                }
                            });
                        }
                        if (i == j) {
                            projectPocDetails.forEach(function (projectPocDetail, index) {
                                var activityExists = false;
                                base('Activity').select({
                                    view: "Weekly Status"
                                }).eachPage(function page(records, fetchNextPage) {
                                    // This function (`page`) will get called for each page of records.
                                    var projectID = projectPocDetail['Project ID'];
                                    records.forEach(function (record) {
                                        var projects = record.get('Project');
                                        projects.forEach(function (project) {
                                            if (projectID == project) {
                                                activityExists = true;
                                            }
                                        });
                                    });
                                    // To fetch the next page of records, call `fetchNextPage`.
                                    // If there are more records, `page` will get called again.
                                    // If there are no more records, `done` will get called.
                                    fetchNextPage();
                                }, function done(err) {
                                    if (err) {
                                        console.error(err);
                                        return;
                                    } else {
                                        var mondayMsg = "You have not filled the weekly project status report for the project ";
                                        projectPocDetail['activity exists'] = activityExists;
                                        getPocEmailId([projectPocDetail], mondayMsg);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        }
    });
    // check for active projects that does not have weekly status activity since Friday - Monday
    // send second reminder email to above project partner POCS
    res.status(200).end("Monday reminder sent successfuly!");
});

//send wednesday mail
router.get('/wednesdayreminder', (req, res, next) => {
    // fetch all the active projects
    // find the partner poc for active projects
    // fetch all the active projects
    var partnerPoc = [];
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
        // Selecting the first 25 records in Main View:
        view: "Active Projects Poc"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            //record.get('Partner PoC');
            var projectID = record.id;
            var projectName = record.get('Project Name');
            var pocs = record.get('Partner PoC');
            partnerPoc.push({ 'Project ID': projectID, 'Project Name': projectName, 'Partner Poc': pocs });
        });
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    }, function done(err) {
        if (err) {
            console.error(err);
            return;
        } else {
            var projectPocDetails = [];
            var i = 0;
            var j = 0;
            partnerPoc.forEach(function (pocs, index) {
                var projectID = pocs['Project ID'];
                var projectName = pocs['Project Name'];
                var partnerPocs = pocs['Partner Poc'];
                var pocArray = [];
                i = i + partnerPocs.length;
                // find the partner poc for active projects
                projectPocDetails.push({ 'Project ID': projectID, 'Project Name': projectName, 'Partner Poc': pocArray, 'activity exists': false });
                partnerPocs.forEach(function (partnerPoc) {
                    base('Contacts').find(partnerPoc, function (err, record) {
                        j = j + 1;
                        if (err) {
                            console.error(err);
                            return;
                        } else {
                            projectPocDetails.forEach(function (projectPocDetail) {
                                if (projectName == projectPocDetail['Project Name']) {
                                    var contactName = record.get('Name');
                                    var contactEmail = record.get('Email');
                                    projectPocDetail['Partner Poc'].push({ 'Name': contactName, 'Email': contactEmail });
                                }
                            });
                        }
                        if (i == j) {
                            projectPocDetails.forEach(function (projectPocDetail, index) {
                                var activityExists = false;
                                base('Activity').select({
                                    view: "Weekly Wed Status"
                                }).eachPage(function page(records, fetchNextPage) {
                                    // This function (`page`) will get called for each page of records.
                                    var projectID = projectPocDetail['Project ID'];
                                    records.forEach(function (record) {
                                        var projects = record.get('Project');
                                        projects.forEach(function (project) {
                                            if (projectID == project) {
                                                activityExists = true;
                                            }
                                        });
                                    });
                                    // To fetch the next page of records, call `fetchNextPage`.
                                    // If there are more records, `page` will get called again.
                                    // If there are no more records, `done` will get called.
                                    fetchNextPage();
                                }, function done(err) {
                                    if (err) {
                                        console.error(err);
                                        return;
                                    } else {
                                        var wednesdayMsg = "You have not filled the weekly project status report for the project ";
                                        projectPocDetail['activity exists'] = activityExists;
                                        getProjectPocEmailId([projectPocDetail], wednesdayMsg);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        }
    });
    // check for active projects that does not have weekly status activity since Friday - Monday
    // send second reminder email to above project partner POCS
    res.status(200).end("Wednesday reminder sent successfuly!");
});


// send a reminder email to add weekly status activity
var getPocEmailId = function (pocDetails, msg) {
    pocDetails.forEach(function (pocDetail) {
        if (pocDetail['activity exists'] == false) {
            var projectName = pocDetail['Project Name'];
            var names = "";
            var emails = "";
            pocDetail['Partner Poc'].forEach(function (pocNameEmail, index) {
                names += pocNameEmail['Name'];
                emails += pocNameEmail['Email'];
                if (index < pocDetail['Partner Poc'].length - 1) {
                    names += "/ ";
                    emails += ", ";
                }
            });
            sendEmail(projectName, names, emails, msg);
        }
    });
}
var sendEmail = function (projectName, pocName, pocEmails, msg) {
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: pocEmails,
        subject: 'Weekly Project Status Reminder',
        html: '<p>Dear ' + pocName + ',</p><p>' + msg + '<b>' + projectName + '</b>. </p><p> You can submit it using below link. </p><p> <a href="https://airtable.com/shrMG7SOe8kqlOcvn">https://airtable.com/shrMG7SOe8kqlOcvn</a> </p><p> Thanks, <br> Tech4Dev Team</p>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info);
        }
    });
}
var getProjectPocEmailId = function (pocDetails, msg) {
    pocDetails.forEach(function (pocDetail) {
        if (pocDetail['activity exists'] == false) {
            var projectName = pocDetail['Project Name'];
            var names = "";
            var emails = "";
            pocDetail['Partner Poc'].forEach(function (pocNameEmail, index) {
                names += pocNameEmail['Name'];
                emails += pocNameEmail['Email'];
                if (index < pocDetail['Partner Poc'].length - 1) {
                    names += "/ ";
                    emails += ", ";
                }
            });
            sendWednesdayEmail(projectName, names, emails, msg);
        }
    });
}
var sendWednesdayEmail = function (projectName, pocName, pocEmails, msg) {
    let toEmail = pocEmails;
    if (process.env.DEBUG == 1) {
        toEmail = process.env.DEBUG_EMAIL;
    }
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: toEmail,
        cc: process.env.REPORTING_EMAIL,
        subject: 'Weekly Project Status Reminder',
        html: '<p>Dear ' + pocName + ',</p><p>' + msg + '<b>' + projectName + '</b>. </p><p> You can submit it using below link. </p><p> <a href="https://airtable.com/shrMG7SOe8kqlOcvn">https://airtable.com/shrMG7SOe8kqlOcvn</a> </p><p> Thanks, <br> Tech4Dev Team</p>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info);
        }
    });
}
module.exports = router;