const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const Excel = require("exceljs");
const getExchangeRates = require("get-exchange-rates-usd");
var Promise = require("bluebird");
const formatterUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
});
const formatterINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2
});
dotenv.config();
var usdRates = 1;
Promise.try(function() {
  return getExchangeRates();
}).then(function(rates) {
  if (rates) {
    usdRates = rates.INR;
  }
});

router.get("", (req, res, next) => {
  const baseTemplate = `<html>
        <head>
            <title>Cohort Wise Report</title>
        </head>
        <body>
            <h2>Cohort Wise Report</h2>
            <ul>
                <li>
                    <a href='/report/firstCohort'>
                        Download First Cohort Report
                    </a>
                </li>
            </ul>
        </body>
    </html>`;
  res.status(200).end(baseTemplate);
});
router.get("/firstCohort", (req, res, next) => {
  // fetch all the active projects
  var firstCohortProjects = [];
  var startDateString = req.query.startDate;
  var endDateString = req.query.endDate;
  // if(startDate > endDate){
  //     res.status(200).end("<span style='color:red'>Improper date range</span>");
  // }
  var Airtable = require("airtable");
  var base = new Airtable({
    apiKey: process.env.AIRTABLE_API_KEY
  }).base("appfO9PMTzzFk9466");
  base("Projects")
    .select({
      // Selecting the first 25 records in Main View:
      view: "Cohort wise report (Do not modify)"
    })
    .eachPage(
      function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record) {
          var projectId = record.id;
          var ngoName = record.get("NGO Name");
          var ngoSector = record.get("NGO Sector");
          var ngoMission = record.get("NGO Mission");
          var spName = record.get("SP Name");
          var description = record.get("Description");
          var estimatedWeeks = record.get("Estimated Weeks");
          var weeksSpent = record.get("Weeks Spent");
          var status = record.get("Status");
          var grade = record.get("Grade");
          var projectCost = record.get("Project Cost");
          var usdProjectCost = record.get("Project Cost");
          var toolsUsed = record.get("Tools Used");
          if (ngoName) {
            if (usdProjectCost) {
              usdProjectCost = usdProjectCost / usdRates;
            }

            firstCohortProjects.push({
              projectId: projectId,
              ngoName: ngoName[0],
              ngoSector: ngoSector[0],
              ngoMission: ngoMission[0],
              spName: spName[0],
              description: description,
              estimatedWeeks: estimatedWeeks,
              weeksSpent: weeksSpent,
              status: status,
              grade: grade,
              projectCost:
                projectCost != undefined
                  ? formatterINR.format(projectCost)
                  : "",
              usdProjectCost:
                usdProjectCost != undefined
                  ? formatterUSD.format(usdProjectCost)
                  : "",
              toolsUsed: toolsUsed,
              completed: "",
              comments: "",
              blog: ""
            });
          }
        });
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        } else {
          var ngoCount = 0;
          var tempNgoCount = 0;
          firstCohortProjects.forEach(function(firstCohortProject, index) {
            ngoCount++;
            var projectID = firstCohortProject["projectId"];
            var comment = "";
            var percentCompleted = "";
            var hoursSpent = 0;
            var linkToBlog = "";

            base("Activity")
              .select({
                view: "Cohort Project Status (Do not modify)"
              })
              .eachPage(
                function page(records, fetchNextPage) {
                  // This function (`page`) will get called for each page of records.
                  records.forEach(function(record) {
                    var project = record.get("Project");
                    if (projectID == project) {
                      comment += record.get("Comments");
                      if (comment != "") {
                        comment += ", ";
                      }
                      hoursSpent += record.get("Hours spent");
                      percentCompleted = record.get("% Completed");
                      if (record.get("Link to Blog") != undefined) {
                        linkToBlog += record.get("Link to Blog");
                        if (linkToBlog != "") {
                          linkToBlog += ", ";
                        }
                      }
                    }
                  });
                  fetchNextPage();
                },
                function done(err) {
                  if (err) {
                    console.error(err);
                    return;
                  } else {
                    tempNgoCount++;
                    firstCohortProject["completed"] = percentCompleted;
                    firstCohortProject["comments"] = comment.replace(
                      /,\s*$/,
                      ""
                    );
                    firstCohortProject["weeksSpent"] =
                      hoursSpent != 0 ? (hoursSpent / 40).toFixed(2) : "0";
                    firstCohortProject["blog"] = linkToBlog.replace(
                      /,\s*$/,
                      ""
                    );

                    if (ngoCount == tempNgoCount) {
                      const workbook = new Excel.Workbook();
                      const worksheet = workbook.addWorksheet("First Cohort");

                      // add column headers
                      worksheet.columns = [
                        {
                          header: "NGO Name",
                          key: "ngoName",
                          width: 20,
                          bold: true
                        },
                        { header: "NGO Sector", key: "ngoSector", width: 20 },
                        { header: "NGO Mission", key: "ngoMission", width: 20 },
                        { header: "SP Name", key: "spName", width: 20 },
                        {
                          header: "Project Description",
                          key: "description",
                          width: 40
                        },
                        {
                          header: "Estimated Weeks",
                          key: "estimatedWeeks",
                          width: 20
                        },
                        { header: "Weeks Spent", key: "weeksSpent", width: 20 },
                        { header: "Project Stage", key: "status", width: 20 },
                        { header: "% Completed", key: "completed", width: 20 },
                        { header: "Grade", key: "grade", width: 20 },
                        {
                          header: "Project Cost (INR)",
                          key: "projectCost",
                          width: 20
                        },
                        {
                          header: "Project Cost (USD)",
                          key: "usdProjectCost",
                          width: 20
                        },
                        { header: "Tools Used", key: "toolsUsed", width: 20 },
                        { header: "Comments", key: "comments", width: 80 },
                        { header: "Link to blog", key: "blog", width: 80 }
                      ];

                      var i = 0;

                      worksheet.addRows(firstCohortProjects);
                      var rowCount = worksheet.rowCount;
                      for (i = 1; i <= rowCount; i++) {
                        let row = worksheet.getRow(i);
                        if (row === null || !row.values || !row.values.length)
                          return [];

                        row.alignment = {
                          wrapText: true,
                          vertical: "middle",
                          horizontal: "center"
                        };
                        if (i == 1) {
                          for (j = 1; j <= row.values.length; j++) {
                            row.getCell(j).font = { bold: true };
                          }
                        }
                        /*if (i > 1) {
                                            for (j = 1; j <= row.values.length; j++) {
                                                if (j == (row.values.length - 1)) {
                                                    var blogLink = row.getCell(j).text;
                                                    if (blogLink != "") {
                                                        row.getCell(j).value = {
                                                            text: blogLink,
                                                            hyperlink: blogLink
                                                        };
                                                    }
                                                }
                                            }
                                        }*/
                      }

                      var fileName = "First_Cohort_Report.xlsx";

                      res.setHeader(
                        "Content-Type",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      );
                      res.setHeader(
                        "Content-Disposition",
                        "attachment; filename=" + fileName
                      );

                      workbook.xlsx.write(res).then(function() {
                        res.end();
                      });
                    }
                  }
                }
              );
          });
        }
      }
    );
});

module.exports = router;
