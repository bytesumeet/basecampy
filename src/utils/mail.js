import Mailgen from "mailgen";
import nodemailer from "nodemailer";
import {
    MAILTRAP_SMTP_HOST,
    MAILTRAP_SMTP_PORT,
    MAILTRAP_SMTP_USERNAME,
    MAILTRAP_SMTP_PASSWORD,
} from "../constants.js";

const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "basecamp",
            link: "https://basecamplink.io",
        },
    });
    const emailTextual = mailGenerator.generatePlaintext(
        options.mailgenContent,
    );
    const emailHtml = mailGenerator.generate(options.mailgenContent);
    const transportor = nodemailer.createTransport({
        host: MAILTRAP_SMTP_HOST,
        port: MAILTRAP_SMTP_PORT,
        auth: {
            user: MAILTRAP_SMTP_USERNAME,
            pass: MAILTRAP_SMTP_PASSWORD,
        },
    });
    const mailOptions = {
        from: "mail.basecamp@example.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    };
    try {
        await transportor.sendMail(mailOptions);
    } catch (error) {
        console.error(
            `Email service failed silently. Make sure that you have provided your mailtrap credentials in the .env file`,
        );
        console.error(`Error: ${error}`);
    }
};

const emailVerificationMailgenContent = (username, verificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to our App! we're excited to have you on board.",
            action: {
                instructions: "Click the button below to verify your email.",
                button: {
                    color: "#22BC66",
                    text: "Verify Email",
                    link: verificationUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

const forgotPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "We got a request to reset the password of your account",
            action: {
                instructions: "Click the button below to reset your password.",
                button: {
                    color: "#22BC66",
                    text: "Reset Password",
                    link: passwordResetUrl,
                },
            },
            outro: "Need help, or have questions? Just reply to this email, we'd love to help.",
        },
    };
};

export {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
};
