const { Resend } = require('resend');

function requiredSetting(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not configured`);
    }
    return value;
}

function recipients() {
    return requiredSetting('NOTIFICATION_TO')
        .split(',')
        .map((address) => address.trim())
        .filter(Boolean);
}

function safeSubject(value) {
    return value.replace(/[\r\n]/g, ' ').trim();
}

async function sendContactNotification({ name, email, subject, message }) {
    const resend = new Resend(requiredSetting('RESEND_API_KEY'));
    const result = await resend.emails.send({
        from: requiredSetting('NOTIFICATION_FROM'),
        to: recipients(),
        replyTo: email,
        subject: `[batyrbek.com] ${safeSubject(subject)}`,
        text: [
            'New website contact submission',
            '',
            `Name: ${name}`,
            `Email: ${email}`,
            `Subject: ${safeSubject(subject)}`,
            '',
            'Message:',
            message
        ].join('\n')
    });

    if (result.error) {
        throw new Error(result.error.message);
    }
}

module.exports = { sendContactNotification };
