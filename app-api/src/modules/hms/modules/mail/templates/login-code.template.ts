export class LoginCodeTemplate {
  static generate(token: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Access Code</h2>
        <p>Use the code below to log in:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; letter-spacing: 2px; margin: 20px 0;">
          ${token}
        </div>
        <p>This code is valid for 15 minutes.</p>
        <p style="color: #777; font-size: 12px;">If you did not request this code, please ignore this email.</p>
      </div>
    `;
  }
}
