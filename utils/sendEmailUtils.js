const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Set up the email transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,   // smtp.gmail.com
    port: process.env.SMTP_PORT,    // 465
    secure: true,                   // use SSL
    auth: {
        user: process.env.SMTP_USER, // your-email@gmail.com
        pass: process.env.SMTP_PASS,  // your-app-password or gmail-password
    },
});

// Function to send email
const sendEmail = async ({ to, subject, templatePath, templateData }) => {
    try {
        // Read the template file
        const template = await fs.readFile(path.join(__dirname, templatePath), 'utf-8');

        // Replace all placeholders dynamically
        const htmlContent = Object.keys(templateData).reduce((content, key) => {
            const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
            return content.replace(regex, templateData[key]);
        }, template);

        // Mail options
        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            html: htmlContent,
        };

        // Send email
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw new Error('Email could not be sent: ' + error.message);
    }
};

module.exports = sendEmail;
