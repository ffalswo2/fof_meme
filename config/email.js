const nodemailer = require('nodemailer');

const smtpTransport = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: "makeus.fofapp@gmail.com",
        pass: "fofapp123!"
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports={
    smtpTransport
}