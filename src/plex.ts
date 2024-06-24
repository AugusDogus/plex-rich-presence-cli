interface Server {
  name: string;
  connections: InferSelectModel<typeof servers>;
}

import { servers, playback } from "./schema";

import type { InferSelectModel } from "drizzle-orm";

export const fetchUserID = async () => {
  const url = "https://plex.tv/api/v2/user";
  const headers = new Headers();
  headers.set("Accept", "application/json");
  headers.set("X-Plex-Token", Bun.env.PLEX_TOKEN as string);

  const options = {
    method: "GET",
    headers,
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) return null;

    const data = await response.json();

    return data.user.id;
  } catch (error) {
    return null;
  }
};

export const fetchPlexServers = async (): Promise<Server[]> => {
  const url = new URL("https://plex.tv/api/v2/resources");
  url.searchParams.append("X-Plex-Token", Bun.env.PLEX_TOKEN as string);
  url.searchParams.append("X-Plex-Client-Identifier", "plex-rich-presence");

  const headers = new Headers();
  headers.set("Accept", "application/json");

  const options = {
    method: "GET",
    headers,
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) return [];

    const data = await response.json();

    // Filter out only Plex Media Server devices
    const servers = data
      .filter((device: any) => device.product === "Plex Media Server")
      // Process the data
      .map((device: any) => ({
        name: device.name,
        connections: device.connections
          ? device.connections.map((connection: any) => ({
              guid: device.clientIdentifier,
              uri: connection.uri,
            }))
          : [],
      }));

    return servers;
  } catch (error) {
    return [];
  }
};

export const checkConnection = async (
  server: InferSelectModel<typeof servers>
) => {
  const url = `${server.uri}/status/sessions?X-Plex-Token=${Bun.env.PLEX_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    return {
      uri: server.uri,
      active: response.ok,
      guid: server.guid,
    };
  } catch (error) {
    return {
      uri: server.uri,
      active: false,
      guid: server.guid,
    };
  }
};

export const fetchSessions = async (
  server: InferSelectModel<typeof servers>
) => {
  const url = `${server.uri}/status/sessions?X-Plex-Token=${Bun.env.PLEX_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.MediaContainer && data.MediaContainer.Metadata) {
        return data.MediaContainer.Metadata.map((item: any) => ({
          guid: item.guid,
          grandparentTitle: item.grandparentTitle,
          parentTitle: item.parentTitle,
          index: item.index,
          userID: item.User.id,
        }));
      }
    }
  } catch (error) {
    return null;
  }
  return null;
};
