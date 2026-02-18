import { Octokit } from "@octokit/rest";
import { logger } from "./logger";

let connectionSettings: any;

async function getAccessToken(): Promise<string | null> {
  if (
    connectionSettings &&
    connectionSettings.settings?.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) {
    return null;
  }

  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    return null;
  }

  try {
    connectionSettings = await fetch(
      "https://" +
        hostname +
        "/api/v2/connection?include_secrets=true&connector_names=github",
      {
        headers: {
          Accept: "application/json",
          X_REPLIT_TOKEN: xReplitToken,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => data.items?.[0]);

    const accessToken =
      connectionSettings?.settings?.access_token ||
      connectionSettings?.settings?.oauth?.credentials?.access_token;

    if (!accessToken) {
      logger.warn("GitHub connection exists but no access token found");
      return null;
    }

    return accessToken;
  } catch (error) {
    logger.error(error, "Failed to fetch GitHub access token from Replit connector");
    return null;
  }
}

export async function getGitHubToken(): Promise<string | null> {
  const connectorToken = await getAccessToken();
  if (connectorToken) {
    return connectorToken;
  }

  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  return null;
}

export async function getGitHubClient(): Promise<Octokit> {
  const token = await getGitHubToken();
  return new Octokit(token ? { auth: token } : {});
}
