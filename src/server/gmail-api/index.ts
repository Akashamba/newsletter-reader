import { google } from "googleapis";
import { auth } from "~/server/better-auth/index"; // Your Better Auth instance

export async function getGmailClient(headers: Headers) {
  const session = await auth.api.getSession({ headers: headers });

  if (!session?.user) {
    throw new Error("Not authenticated");
  }

  // Get access token from better-auth
  const accessToken = await auth.api.getAccessToken({
    body: {
      providerId: "google",
      userId: session.user.id,
    },
  });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );

  oauth2Client.setCredentials({
    access_token: accessToken.accessToken,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}
