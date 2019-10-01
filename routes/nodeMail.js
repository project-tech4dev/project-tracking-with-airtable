var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var options = {
    service: 'Gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD
    }
}
var optionsSendgrid = {
    auth: {
        api_user: process.env.SEND_GRID_USER,
        api_key: process.env.SEND_GRID_PASSWORD
    }
}
var transporterMail= nodemailer.createTransport(options);
    
var transporterSendgrid = nodemailer.createTransport(optionsSendgrid);

module.exports = transporterMail;
// module.exports = transporterSendgrid;