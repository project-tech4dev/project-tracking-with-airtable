const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const callNodeMail = require('../config/mail');
var transporter = callNodeMail;

router.get('', (req, res, next) => {
    const baseTemplate = `<html>
        <head>
            <title>Communication Status</title>
        </head>
        <body>
            <h2>Communication Status</h2>
            <ul>
                <li>
                    <a href='/weeklycommunicationstatus/sp_ngo_reminder'>
                        Communication Reminder
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
    res.status(200).end(baseTemplate);
});
router.get('/sp_ngo_reminder', (req, res, next) => {
    // fetch all the active projects
    var partnerPoc = [];
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
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
                            projectPocDetails.forEach(function (projectPocDetail, index) {
                                var activityExists = false;
                                base('Activity').select({
                                    view: "NGO Communication Status"
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
    res.status(200).end("Communication reminder sent successfuly!");
});
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
        subject: 'Weekly Communication Status Reminder',
        html: '<p>Dear ' + pocName + ',</p><p> This is a gentle reminder to fill the weekly communication report with the NGO for the project <b>' + projectName + '</b>. </p><p> You can submit it using below link. </p><p> <a href="https://airtable.com/shr8F6DTv44XZWIMr">https://airtable.com/shr8F6DTv44XZWIMr</a> </p><p> Thanks, <br> Tech4Dev Team</p>'
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