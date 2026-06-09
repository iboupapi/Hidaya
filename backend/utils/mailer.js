const nodemailer = require('nodemailer');

// Configuration du transporteur d'email
// Pour tes tests, tu pourras utiliser un compte Gmail ou un service fictif comme Mailtrap
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER, // Ton adresse email (ex: dahira.imane@gmail.com)
    pass: process.env.SMTP_PASS, // Ton mot de passe d'application (généré dans Google Sécurité)
  },
});

/**
 * Fonction pour envoyer un email de notification groupé
 * @param {Array} emails - Liste des adresses emails des disciples
 * @param {String} audioTitle - Titre du nouvel audio uploader
 * @param {String} category - Catégorie (Enseignement, Émission...)
 */
exports.sendNewAudioEmail = async (emails, audioTitle, category) => {
  if (!emails || emails.length === 0) return;

  const mailOptions = {
    from: `"Dahiratoul Imane" <${process.env.SMTP_USER}>`,
    bcc: emails.join(','), // bcc (Copie Cachée) évite que les disciples voient les emails des autres
    subject: `✨ Nouvel audio disponible : ${audioTitle}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #1b4d3e; text-align: center;">Dahiratoul Imane</h2>
        <p>As-salāmu 'alaykum wa rahmatullāhi wa barakātuhu,</p>
        <p>Nous avons la joie de vous informer qu'un nouveau contenu spirituel vient d'être publié sur l'application <strong>Hidaya</strong>.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #1b4d3e; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px;"><strong>Titre :</strong> ${audioTitle}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;"><strong>Catégorie :</strong> ${category}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="text-align: center;">
          <a href="http://localhost:5173" style="background-color: #1b4d3e; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Écouter sur l'application</a>
        </p>
        <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px;">
          Cet email vous est envoyé automatiquement par le Dahira Dahiratoul Imane.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Emails de notification envoyés avec succès !");
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email :", error);
  }
};