var nodemailer = require('nodemailer');
var optionMail = {
    host: 'smtp.googlemail.com', // Gmail Host
    port: 465, // Port
    secure: true, // this is true as port is 465
    auth: {
        user: process.env.GMAIL_USERNAME, //Gmail username
        pass: process.env.GMAIL_PASSWORD // Gmail password
    }
}
var transporter = nodemailer.createTransport(optionMail);
module.exports = transporter;