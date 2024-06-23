interface Connection {
  address: string | null;
  port: string | null;
}

interface Server {
  name: string | null;
  connections: Connection[];
}

async function fetchPlexServers(): Promise<Server[]> {
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

    if (!response.ok) {
      console.error(
        `Error fetching Plex servers: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();
    const servers = data
      .filter((device: any) => device.product === "Plex Media Server")
      .map((device: any) => ({
        name: device.name,
        connections: (device.connections || []).map((connection: any) => ({
          address: connection.address,
          port: connection.port,
        })),
      }));

    return servers;
  } catch (error) {
    console.error("Failed to fetch Plex servers:", error);
    return [];
  }
}

async function fetchPlexHistory(server: Server) {
  for (const connection of server.connections) {
    if (!connection.address || !connection.port) {
      continue;
    }

    const url = `http://${connection.address}:${connection.port}/status/sessions?X-Plex-Token=${Bun.env.PLEX_TOKEN}`;

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
            grandparentTitle: item.grandparentTitle,
            parentTitle: item.parentTitle,
            index: item.index,
          }));
        }
      }
    } catch (_error) {}
  }
  return [];
}

const servers = await fetchPlexServers();

if (servers.length === 0) {
  console.log("No servers found.");
} else {
  const allHistory = [];
  for (const server of servers) {
    const history = await fetchPlexHistory(server);
    if (history) {
      allHistory.push(...history);
    }
  }

  allHistory.forEach((item) => {
    console.log(
      `grandparentTitle: ${item.grandparentTitle}, parentTitle: ${item.parentTitle}, index: ${item.index}`
    );
  });
}
