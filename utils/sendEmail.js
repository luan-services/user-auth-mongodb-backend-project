import nodemailer from "nodemailer";

export const sendEmail = async (options) => {

    const transporter = nodemailer.createTransport({ // cria um objeto transporter, são as configurações de onde 
        // vai ser enviado o e-mail e por qual conta.  
        host: process.env.EMAIL_HOST, 
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = { // defina as opções do e-mail
        from: 'USER AUTH APP <contato@user-auth-backend.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transporter.sendMail(mailOptions);
};