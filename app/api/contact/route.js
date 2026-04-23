import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        if (!name || !email || !message) {
            return new Response(JSON.stringify({ success: false, error: 'All fields are required.' }), { status: 400 });
        }

        // Configure nodemailer transporter using environment variables
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Setup email data
        const mailOptions = {
            from: process.env.SMTP_EMAIL,
            to: 'devshopsmart123@yahoo.com',
            subject: 'Regarding feedback or any complaint',
            text: `Name: ${name}\nEmail: ${email}\n\nFeedback/Message:\n${message}`,
            replyTo: email
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return new Response(JSON.stringify({ success: true, message: 'Email sent successfully!' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('SMTP Error:', error);
        return new Response(JSON.stringify({ success: false, error: 'Failed to send email. Check SMTP credentials.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
