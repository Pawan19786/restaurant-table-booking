import nodemailer from "nodemailer";

const sendEmail = async ({ to, subject, html }) => {
  try {
    // We are using SMTP for the system email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // System Email
        pass: process.env.EMAIL_PASS, // System Email App Password
      },
    });

    const mailOptions = {
      from: `"TableTime System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return false;
  }
};

export default sendEmail;
