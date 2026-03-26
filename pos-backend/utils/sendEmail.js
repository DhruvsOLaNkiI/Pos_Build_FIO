const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create a reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Store Admin'} <${process.env.FROM_EMAIL || 'noreply@store.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);
    } catch (err) {
        console.error('Email sending failed', err);
        throw err;
    }
};

module.exports = sendEmail;
