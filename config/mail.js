var nodemailer = require('nodemailer');
var optionMail = {
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USERNAME, //Gmail username
        pass: process.env.SMTP_PASSWORD // Gmail password
    }
}
var transporter = nodemailer.createTransport(optionMail);

var sendEmail = function (projectName, pocName, pocEmails, pocCcEmails, subject, body, addCc) {
    let toEmail = pocEmails;
    if (process.env.DEBUG == 1) {
        toEmail = process.env.DEBUG_EMAIL;
    }
    var mailOptions = {
        from: process.env.FROM_EMAIL,
        to: toEmail,
        cc: '',
        subject: subject,
        html: body
    };
    if (addCc == true) {
        if(pocCcEmails){
            mailOptions.cc = pocCcEmails;
            console.log("mail cc ", pocCcEmails);
        }else{
            mailOptions.cc = process.env.REPORTING_EMAIL;
        }
    }
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info);
        }
    });
}
module.exports = sendEmail;