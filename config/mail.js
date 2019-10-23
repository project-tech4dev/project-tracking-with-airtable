var nodemailer = require('nodemailer');
var optionMail = {
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USERNAME, //Gmail username
        pass: process.env.GMAIL_PASSWORD // Gmail password
    }
}
var transporter = nodemailer.createTransport(optionMail);
module.exports = transporter;