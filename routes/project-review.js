const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();
const callNodeMail = require('../config/mail');
var transporter = callNodeMail;

router.get('', (req, res, next) => {
    const baseTemplate = `<html>
    <head>
        <title> Project Review </title>
    </head>
    <body>
        <h2>Project Review</h2>
        <ul>
            <li>
                <a href='activitystatus/project_review'>
                    Submit Project Review
                </a>
            </li>
        </ul>
    </body>
    </html>`;
    res.status(200).end(baseTemplate);
});

router.get('/project_review', (req, res, next) => {
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    var projNames = [];
    base('Projects').select({
        view: "Active programs (Do not modify)"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            var projectName = record.get('Project Name');
            var projectId = record.id;
            projNames.push({ "Project Name": projectName, "Project ID": projectId });
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
            projNames.forEach(function (pocs, index) {
                var projectID = pocs['Project ID'];
                var projectName = pocs['Project Name'];
                var activityPreviewExist = false;
                var activityProjectNames = [];
                activityProjectNames.push({ "Project ID": projectID, "Project": projectName });
                base('Activity').select({
                    view: "Project Review Status (Do not modify)"
                }).eachPage(function page(records, fetchNextPage) {
                    // This function (`page`) will get called for each page of records.
                    records.forEach(function (record) {
                        var activityTypes = [];
                        activityTypes.push(record.get('Type'));
                        var project = record.get('Project');
                        if (projectID == project) {
                            activityTypes.forEach(function (activityType) {
                                if (activityType == "Project Review") {
                                    activityPreviewExist = true;
                                }
                            });
                        }
                    });
                    fetchNextPage();
                }, function done(err) {
                    if (err) {
                        console.error(err);
                        return;
                    } else {
                        var subject = 'Project Review Reminder';
                        var body = `<p>Hello,</p>
                        <p> This is the reminder to fill project review for the project '${projectName}'. </p>
                        <p> Please use below link to fill the project review. </p>
                        <p> <a href="https://airtable.com/shrEPvmxyRmiAjjjU">https://airtable.com/shrEPvmxyRmiAjjjU</a> </p>
                        <p> Thanks & Regards,</p>
                        <p> Tech4Dev</p>`;
                        if (!activityPreviewExist)
                            transporter(projectName, "", process.env.FROM_EMAIL, subject, body, false);
                    }
                });
            });
        }
    });
    res.status(200).end("Project Review Reminder Sent Successfully!");
});
module.exports = router;