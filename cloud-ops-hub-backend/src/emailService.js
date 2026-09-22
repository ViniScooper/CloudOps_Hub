const nodemailer = require('nodemailer');
const https = require('https');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const REQUESTS_FILE = path.join(__dirname, '..', 'database', 'access_requests.json');

// Envia alerta imediato no WhatsApp do Vinícius via CallMeBot
function sendWhatsAppAlert(name, email, note = '') {
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const text = `🚀 *CloudOps Hub - Novo Pedido de Acesso!*\n\n👤 *Nome:* ${name}\n✉️ *E-mail:* ${email}${note ? `\n📝 *Nota:* ${note}` : ''}\n\nResponda enviando as credenciais de teste para o solicitante.`;
  const encodedText = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ success: true });
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// Salva solicitação no arquivo JSON e tenta salvar no MySQL
async function saveAccessRequest({ name, email, note }) {
  const record = {
    id: 'req-' + Date.now(),
    name,
    email,
    note: note || '',
    status: 'pending',
    requestedAt: new Date().toISOString()
  };

  // 1. Salva em JSON local permanente
  try {
    const dir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    let list = [];
    if (fs.existsSync(REQUESTS_FILE)) {
      try { list = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch {}
    }
    list.unshift(record);
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[EmailService] Erro ao salvar access_requests.json:', err.message);
  }

  // 2. Tenta salvar no MySQL se a tabela existir
  try {
    await db.query(
      'INSERT INTO access_requests (id, name, email, note, status) VALUES (?, ?, ?, ?, ?)',
      [record.id, name, email, note || '', 'pending']
    );
  } catch (err) {
    // Se a tabela ainda não existir, cria e insere
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS access_requests (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL,
          note TEXT,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await db.query(
        'INSERT INTO access_requests (id, name, email, note, status) VALUES (?, ?, ?, ?, ?)',
        [record.id, name, email, note || '', 'pending']
      );
    } catch (createErr) {
      console.warn('[EmailService] Aviso ao persistir no MySQL (salvo em JSON):', createErr.message);
    }
  }

  return record;
}

// Dispara e-mail para vviniciuslourenco@gmail.com
async function sendAccessRequestEmail({ name, email, note }) {
  // Salva a solicitação
  await saveAccessRequest({ name, email, note });

  // Dispara alerta WhatsApp em background
  sendWhatsAppAlert(name, email, note).catch(() => {});

  try {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
      });
    }

    const mailOptions = {
      from: '"CloudOps Hub" <no-reply@cloudops.hub>',
      to: 'vviniciuslourenco@gmail.com',
      replyTo: email,
      subject: `[CloudOps Hub] Nova Solicitação de Acesso: ${name}`,
      text: `Olá Vinicius,\n\nUm novo usuário solicitou acesso ao CloudOps Hub:\n\nNome: ${name}\nE-mail: ${email}\n${note ? `Nota: ${note}\n` : ''}\nData: ${new Date().toLocaleString('pt-BR')}\n\nPara liberar o acesso, responda a este e-mail enviando as credenciais de teste para o solicitante.\n\nAtenciosamente,\nCloudOps Hub`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0c1518; color: #e2edeb; padding: 24px; border-radius: 10px;">
          <h2 style="color: #20d6c7; margin-top: 0;">🚀 Nova Solicitação de Acesso ao CloudOps Hub</h2>
          <p>Um novo usuário solicitou acesso para testar a plataforma:</p>
          <div style="background: #142226; padding: 16px; border-radius: 8px; border-left: 4px solid #20d6c7; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Nome:</strong> ${name}</p>
            <p style="margin: 4px 0;"><strong>E-mail:</strong> <a href="mailto:${email}" style="color: #20d6c7;">${email}</a></p>
            ${note ? `<p style="margin: 4px 0;"><strong>Observação:</strong> ${note}</p>` : ''}
            <p style="margin: 4px 0; font-size: 12px; color: #829d9c;"><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <p style="margin-top: 16px; font-size: 13px; color: #a1b5b3;">
            Clique em responder para enviar os dados de acesso diretamente a <strong>${email}</strong>.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (err) {
    console.error('[EmailService] Aviso no envio de e-mail (WhatsApp e JSON registrados):', err.message);
    return { success: true, warning: err.message };
  }
}

// Dispara e-mail com as credenciais aprovadas diretamente para o usuário
async function sendWelcomeCredentialsEmail({ name, email, tempPassword }) {
  try {
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
      });
    }

    const mailOptions = {
      from: '"CloudOps Hub" <no-reply@cloudops.hub>',
      to: email,
      subject: `🎉 Seu Acesso ao CloudOps Hub Foi Aprovado!`,
      text: `Olá ${name},\n\nSeu acesso ao CloudOps Hub foi liberado com sucesso!\n\nURL de Acesso: https://cloudops-hub-dun.vercel.app/\nE-mail: ${email}\nSenha Temporária: ${tempPassword}\n\nVocê já pode entrar e conectar sua VPS ou explorar os recursos.\n\nAtenciosamente,\nEquipe CloudOps Hub`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0c1518; color: #e2edeb; padding: 28px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid rgba(32, 214, 199, 0.3);">
          <h2 style="color: #20d6c7; margin-top: 0;">🎉 Acesso Liberado ao CloudOps Hub!</h2>
          <p>Olá <strong>${name}</strong>, sua solicitação de acesso foi avaliada e aprovada pelo administrador.</p>
          
          <div style="background: #142226; padding: 20px; border-radius: 8px; border-left: 4px solid #20d6c7; margin: 20px 0;">
            <p style="margin: 6px 0;"><strong>Link de Acesso:</strong> <a href="https://cloudops-hub-dun.vercel.app/" style="color: #38bdf8; font-weight: bold;">https://cloudops-hub-dun.vercel.app/</a></p>
            <p style="margin: 6px 0;"><strong>E-mail de Login:</strong> <code style="color: #20d6c7; font-size: 13px;">${email}</code></p>
            <p style="margin: 6px 0;"><strong>Senha Temporária:</strong> <code style="background: #090f11; padding: 3px 8px; border-radius: 4px; color: #10b981; font-weight: bold; font-size: 14px;">${tempPassword}</code></p>
          </div>

          <p style="font-size: 13px; color: #829d9c; line-height: 1.5;">
            Ao acessar pela primeira vez, você poderá cadastrar sua própria VM / VPS conectando via SSH ou explorar a infraestrutura Zero Trust.
          </p>
          
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://cloudops-hub-dun.vercel.app/" style="display: inline-block; background: linear-gradient(135deg, #20d6c7, #0e857b); color: #000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px;">
              Acessar Minha Conta no CloudOps Hub →
            </a>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, info };
  } catch (err) {
    console.warn('[EmailService] Aviso ao enviar e-mail de boas-vindas:', err.message);
    return { success: true, warning: err.message };
  }
}

module.exports = {
  sendAccessRequestEmail,
  sendWelcomeCredentialsEmail,
  sendWhatsAppAlert,
  saveAccessRequest
};

