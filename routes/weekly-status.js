const express = require("express");
const router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

router.get('', (req, res, next) => {
    const baseTemplate = `
    <html>
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
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');

    base('Projects').select({
        // Selecting the first 3 records in Main View:
        maxRecords: 25,
        view: "Active programs"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.

        records.forEach(function (record) {
            console.log('Retrieved', record.get('Project Name'));
        });

        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();

    }, function done(err) {
        if (err) {
            console.error(err);
            return;
        }
    });

    // find the partner poc for active projects

    // send a reminder email to add weekly status activity

    res.status(200).end("Friday reminder sent successfuly!");
});

router.get('/mondayreminder', (req, res, next) => {
    // fetch all the active projects

    // find the partner poc for active projects

    // check for active projects that does not have weekly status activity since Friday - Monday

    // send second reminder email to above project partner POCS

    res.status(200).end("Monday reminder sent successfuly!");
});

module.exports = router;