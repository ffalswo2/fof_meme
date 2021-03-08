const nodemailer = require('nodemailer');

const smtpTransport = nodemailer.createTransport({
    service: "Naver",
    auth: {
        user: "ffalswo2@naver.com",
        pass: "stephan98!"
    },
    tls: {
        rejectUnauthorized: false
    }
});

module.exports={
    smtpTransport
}