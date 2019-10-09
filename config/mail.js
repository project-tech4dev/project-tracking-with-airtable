var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var optionsSendgrid = {
    auth: {
        api_user: process.env.SENDGRID_USER,
        api_key: process.env.SENDGRID_PASSWORD
    }
}
var transporterSendgrid = nodemailer.createTransport(sgTransport(optionsSendgrid));
module.exports = transporterSendgrid;