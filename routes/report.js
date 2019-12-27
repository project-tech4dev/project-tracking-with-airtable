const express = require("express");
const router = express.Router();
const dotenv = require('dotenv');
const Excel = require('exceljs');
dotenv.config();

router.get('', (req, res, next) => {
    const baseTemplate = `<html>
        <head>
            <title>Cohort Wise Report</title>
        </head>
        <body>
            <h2>Cohort Wise Report</h2>
            <ul>
                <li>
                    <a href='/report/firstCohort'>
                        Send First Cohort Report
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
    res.status(200).end(baseTemplate);
});
router.get('/firstCohort', (req, res, next) => {
    // fetch all the active projects
    var firstCohortProjects = [];
    var startDateString = req.query.startDate;
    var endDateString = req.query.endDate;
    // if(startDate > endDate){
    //     res.status(200).end("<span style='color:red'>Improper date range</span>");
    // }
    var Airtable = require('airtable');
    var base = new Airtable({
        apiKey: process.env.AIRTABLE_API_KEY
    }).base('appfO9PMTzzFk9466');
    base('Projects').select({
        // Selecting the first 25 records in Main View:
        view: "Cohort wise report"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function (record) {
            var ngoName = record.get('NGO Name');
            var ngoSector = record.get('NGO Sector');
            var ngoMission = record.get('NGO Mission');
            var spName = record.get('SP Name');
            var description = record.get('Description');
            var estimatedWeeks = record.get('Estimated Weeks');
            var status = record.get('Status');
            var grade = record.get('Grade');
            var projectCost = record.get('Project Cost');
            var toolsUsed = record.get('Tools Used');
            if(ngoName){
                firstCohortProjects.push({ 
                    'ngoName': ngoName[0], 
                    'ngoSector': ngoSector[0],
                    'ngoMission' : ngoMission[0],
                    'spName' : spName[0],
                    'description' : description,
                    'estimatedWeeks' : estimatedWeeks,
                    'status' : status,
                    'grade' : grade,
                    'projectCost' : projectCost,
                    'toolsUsed' : toolsUsed
                });
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
            const workbook = new Excel.Workbook();
            const worksheet = workbook.addWorksheet('First Cohort');
            
            // add column headers
            worksheet.columns = [
            { header: 'NGO Name', key: 'ngoName', width: 20, bold: true },
            { header: 'NGO Sector', key: 'ngoSector', width: 20 },
            { header: 'NGO Mission', key: 'ngoMission', width: 20 },
            { header: 'SP Name', key: 'spName', width: 20 },
            { header: 'Project Description', key: 'description', width: 20 },
            { header: 'Weeks Spent', key: 'estimatedWeeks', width: 20 },
            { header: 'Project Stage', key: 'status', width: 20 },
            { header: 'Grade', key: 'grade', width: 20 },
            { header: 'Project Cost (INR)', key: 'projectCost', width: 20 },
            { header: 'Tools Used', key: 'toolsUsed', width: 20 }
            ];

            var i = 0;

            worksheet.addRows(firstCohortProjects);
            var rowCount = worksheet.rowCount;
            for(i=1;i<=rowCount;i++){
                worksheet.getRow(i).alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
            }

            var fileName = 'report.xlsx';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

            workbook.xlsx.write(res).then(function(){
                res.end();
            });
        }
    });
});

module.exports = router;