var nodemailer = require('nodemailer');
var optionMail = {
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USERNAME, //Gmail username
        pass: process.env.SMTP_PASSWORD // Gmail password
    }
}
var transporter = nodemailer.createTransport(optionMail);
module.exports = transporter;