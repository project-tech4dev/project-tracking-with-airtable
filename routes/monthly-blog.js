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
                <li>
                    <a href='/monthlystatus/monday_blog_reminder'>
                        Monday Blog Reminder
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
    res.status(200).end(baseTemplate);
});

router.get('/blog_reminder', (req, res, next) => {
    try{
        // fetch all the active projects
        var partnerPoc = [];
        var Airtable = require('airtable');
        var base = new Airtable({
            apiKey: process.env.AIRTABLE_API_KEY
        }).base('appfO9PMTzzFk9466');
        base('Projects').select({
            view: "Active Project Summary (Do not modify)"
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
                if (partnerPoc.length == 0) {
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
                    console.log("partnerPocs", partnerPocs)
                    if(partnerPocs == undefined){
                        return;
                    }
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
                                var blogMsg = "This email is a gentle reminder to post a blog for the project ";                            
                                getPocEmailId([projectPocDetails], blogMsg, false);
                                res.status(200).end("Blog reminder sent successfully!");
                            }
                        });
                    });
                });
            }
        });
    }catch(e){
        console.log(e)
    }
});

router.get('/monday_blog_reminder', (req, res, next) => {
    try{
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
            view: "Active Projects Poc (Do not modify)"
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
                    if(partnerPocs == undefined){
                        return;
                    }
                    i = i + partnerPocs.length;
                    // find the partner poc for active projects
                    projectPocDetails.push({ 'Project ID': projectID, 'Project Name': projectName, 'Partner Poc': pocArray, 'Blog exists': false });
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
                                    var blogExists = false;
                                    base('Activity').select({
                                        view: "Monday Blog Reminder (Do not modify)"
                                    }).eachPage(function page(records, fetchNextPage) {
                                        var isActive = records['Type'];
                                        // This function (`page`) will get called for each page of records.
                                        var projectID = projectPocDetail['Project ID'];
                                        records.forEach(function (record) {
                                            var projects = record.get('Project');
                                            var activityDate = new Date(record.get('Date'));
                                            var activityMonth = activityDate.getMonth();

                                            var today = new Date();
                                            var currentMonth = today.getMonth();
                                            projects.forEach(function (project) {
                                                if (projectID == project) {
                                                if(currentMonth == activityMonth){
                                                        blogExists = true;
                                                }
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
                                            var mondayBlogMsg = "You have not posted the monthly blog for the project ";
                                            projectPocDetail['Blog exists'] = blogExists;
                                            getPocEmailId([projectPocDetail], mondayBlogMsg, false);
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
        res.status(200).end("Monday blog reminder sent successfuly!");
    }catch(e){
        console.log(e)
    }
});


// send a reminder email to add weekly status activity
var getPocEmailId = function (pocDetails) {
    try{
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
                var subject = 'Monthly Blog Reminder';
                var body = `<p>Dear ${names},</p>
                <p>This email is a gentle reminder to post a blog for the project '${projectName}'. 
                <p>Please include the blog URL in your weekly status report.</p>
                <p>Thanks, </p> 
                <p>Tech4Dev Team</p>`
                transporter(projectName, names, emails, null, subject, body, false);
            }
        });
    }catch(e){
        console.log(e)
    }
}

var getPocEmailId = function (pocDetails, msg, addCc) {
    try{
        pocDetails.forEach(function (pocDetail) {
            if (pocDetail['Blog exists'] == false) {
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

                var subject = 'Monthly Blog Reminder';
                var body = `<p>Dear ${names},</p>
                <p>${msg} '${projectName}'.</p>
                <p>Please include the blog URL in your weekly status report.</p>
                <p>Thanks, </p> 
                <p>Tech4Dev Team</p>`;
                transporter(projectName, names, emails, null, subject, body, false);
            }
        });
    }catch(e){
        console.log(e)
    }
}
module.exports = router;