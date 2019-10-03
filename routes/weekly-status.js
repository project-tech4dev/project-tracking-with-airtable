const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const callNodeMail = require('../config/mail');
var transporter = callNodeMail;

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
                            getPocEmailId(projectPocDetails);
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
                        }else {
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
                                        projectPocDetail['activity exists'] = activityExists;
                                        getPocEmailId([projectPocDetail]);
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
// send a reminder email to add weekly status activity
var getPocEmailId = function (pocDetails) {
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
            sendEmail(projectName, names, emails);
        }
    });
}
var sendEmail = function (projectName, pocName, pocEmails) {
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: pocEmails,
        subject: 'Weekly Status Reminder',
        html: '<p>Hello ' + pocName + ',</p><p> This is the reminder to fill weekly status report for the project <b>' + projectName + '</b>. </p><p> Please use below link to fill the report. </p><p> <a href="https://airtable.com/shrMG7SOe8kqlOcvn">https://airtable.com/shrMG7SOe8kqlOcvn</a> </p><p> Thanks & Regards, <br> Tech4Dev</p>'
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