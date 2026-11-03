import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const { name, email, message, honeypot, timestamp } = data;

    // 1. Anti-bot: Honeypot check
    // If the hidden field is filled, it's a bot. Silently accept without sending.
    if (honeypot) {
      console.warn('Bot detected via honeypot:', { name, email, honeypot });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Anti-bot: Submission speed check (minimum 2 seconds)
    const now = Date.now();
    if (timestamp && now - Number(timestamp) < 2000) {
      console.warn('Bot detected via submission speed:', { elapsed: now - Number(timestamp) });
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(JSON.stringify({ error: 'Vyplňte prosím své jméno.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Zadejte prosím platnou e-mailovou adresu.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(JSON.stringify({ error: 'Vyplňte prosím text zprávy.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Chyba konfigurace serveru (chybí API klíč).' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(apiKey);
    const fromEmail = process.env.CONTACT_FROM_EMAIL || 'Martin Cvikýř <info@martincvikyr.cz>';
    const toOwnerEmail = process.env.CONTACT_TO_EMAIL || 'martin.cvikyr@seznam.cz';

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim().replace(/\n/g, '<br />');

    // E-mail 1: Pro majitele (Martin Cvikýř)
    const ownerEmailResult = await resend.emails.send({
      from: fromEmail,
      to: [toOwnerEmail],
      replyTo: cleanEmail,
      subject: `Nová poptávka z webu: ${cleanName}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
          <h2 style="color: #966541; margin-top: 0;">Nová poptávka z webových stránek</h2>
          <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;" />
          <p><strong>Jméno a příjmení:</strong> ${cleanName}</p>
          <p><strong>E-mail:</strong> <a href="mailto:${cleanEmail}" style="color: #966541;">${cleanEmail}</a></p>
          <div style="margin-top: 20px; padding: 15px; background: #faf7f2; border-left: 4px solid #966541; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #555;">Zpráva:</p>
            <p style="margin: 8px 0 0 0; white-space: pre-wrap;">${cleanMessage}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 15px;" />
          <p style="font-size: 13px; color: #888;">Na tuto zprávu můžete odpovědět přímo – odpověď půjde na ${cleanEmail}.</p>
        </div>
      `,
    });

    if (ownerEmailResult.error) {
      console.error('Error sending email to owner:', ownerEmailResult.error);
      return new Response(
        JSON.stringify({ error: `Chyba při odesílání: ${ownerEmailResult.error.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // E-mail 2: Potvrzení pro odesílatele (klienta)
    const clientEmailResult = await resend.emails.send({
      from: fromEmail,
      to: [cleanEmail],
      subject: 'Potvrzení o přijetí zprávy – Martin Cvikýř',
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
          <h2 style="color: #966541; margin-top: 0;">Děkuji za Vaši zprávu</h2>
          <p>Dobrý den, ${cleanName},</p>
          <p>děkuji za Váš zájem a zaslání poptávky. Vaši zprávu jsem v pořádku přijal a ozvu se Vám zpět co nejdříve.</p>
          
          <div style="margin: 20px 0; padding: 15px; background: #faf7f2; border-left: 4px solid #966541; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #555;">Kopie Vaší zprávy:</p>
            <p style="margin: 8px 0 0 0;">${cleanMessage}</p>
          </div>

          <p>Pokud byste potřebovali cokoliv urgentně zkonzultovat, neváhejte mě kontaktovat i telefonicky.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0 15px;" />
          <p style="margin: 0; font-weight: 500;">Martin Cvikýř</p>
          <p style="margin: 2px 0; color: #666; font-size: 14px;">Svatební a firemní videografie</p>
          <p style="margin: 4px 0; font-size: 14px;">Telefon: <a href="tel:+420605314457" style="color: #966541;">+420 605 314 457</a></p>
          <p style="margin: 2px 0; font-size: 14px;">E-mail: <a href="mailto:info@martincvikyr.cz" style="color: #966541;">info@martincvikyr.cz</a></p>
        </div>
      `,
    });

    if (clientEmailResult.error) {
      console.warn('Warning: Confirmation email to sender failed:', clientEmailResult.error);
      // Owner still received the email, so we can return success
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Zpráva byla úspěšně odeslána.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unhandled contact form error:', error);
    return new Response(
      JSON.stringify({ error: 'Došlo k neočekávané chybě. Zkuste to prosím znovu.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

