// Composio service integration — delegates to the real, config-gated client.
import { realApiService } from './realApiService';

export async function composioAuth(app: string) {
  if (!realApiService.composio) {
    console.log(`Authenticating with ${app} via Composio`);
    return { success: true, token: 'placeholder-token' };
  }

  return realApiService.composio.executeAction(`${app.toUpperCase()}_AUTHENTICATE`, {}, undefined);
}

export async function sendEmailViaComposio(emailData: { subject: string; body: string }) {
  if (!realApiService.composio) {
    console.log('Sending email via Composio:', emailData);
    return { success: true, messageId: 'placeholder-id' };
  }

  return realApiService.composio.sendEmail({
    to: import.meta.env.VITE_DEFAULT_EMAIL || 'user@example.com',
    subject: emailData.subject,
    body: emailData.body
  });
}
