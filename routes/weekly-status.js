const express = require("express");
const router = express.Router();

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
    res.status(200).end("Friday reminder sent successfuly!");
});

router.get('/mondayreminder', (req, res, next) => {
    res.status(200).end("Monday reminder sent successfuly!");
});

module.exports = router;