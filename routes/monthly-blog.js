const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const callNodeMail = require('../config/mail');
var transporter = callNodeMail;

router.get('', (req, res, next) => {
    const baseTemplate = `<html>
        <head>
            <title>Blog Reminder</title>
        </head>
        <body>
            <h2>Blog Reminder</h2>
            <ul>
                <li>
                    <a href='/monthlystatus/blog_reminder'>
                        Send Blog Reminder
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
    res.status(200).end(baseTemplate);
});

router.get('/blog_reminder', (req, res, next) => {
    // fetch all the active projects
    var partnerPoc = [];
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
        view: "Active Project Summary"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            var projectName = record.get('Project Name');
            var pocs = record.get('Partner PoC');
            var totalHours = record.get('Total Hours');
            if (totalHours > 50) {
                partnerPoc.push({ 'Project Name': projectName, 'Partner Poc': pocs });
            }
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
            if(partnerPoc.length == 0){
                res.status(200).end("No user found!");
            }
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
                            res.status(200).end("Blog reminder sent successfully!");
                        }
                    });
                });
            });
        }
    });
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
            sendBlogReminder(projectName, names, emails);
            console.log('See', emails);
        }
    });
}
var sendBlogReminder = function (projectName, pocName, pocEmails) {
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: pocEmails,
        subject: 'Monthly Blog Reminder',
        html: '<p>Dear ' + pocName + ',</p><p> This email is a gentle reminder to submit a blog for the project <b>' + projectName + '</b>. Please include the blog URL in your weekly status report. </p><p> Thanks, <br> Tech4Dev Team</p>'
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