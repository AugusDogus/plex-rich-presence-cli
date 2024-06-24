import {
  checkConnection,
  fetchPlexServers,
  fetchSessions,
  fetchUserID,
} from "./plex";
import {
  setDiscordPresence,
  loginToDiscord,
  checkDiscordPresence,
  createDiscordPresence,
} from "./discord";
import { Cron } from "croner";
import { servers, playback } from "./schema";
import { and, eq } from "drizzle-orm/expressions";
import { db } from "./db";
import { inArray } from "drizzle-orm";

const updateServers = async () => {
  // Check if we have any servers in the database
  const dbServers = await db.select().from(servers).all();

  // Fetch the servers from Plex
  const plexServers = await fetchPlexServers();

  // Flatten the Plex servers
  const plexServerConnections = plexServers
    .map((server) => server.connections)
    .flat();

  // Loop through every server in the database
  for (const server of dbServers) {
    // Check if the server is still in the Plex servers
    const found = plexServerConnections.find(
      (connection) => connection.uri === server.uri
    );

    // If the server is not found, delete it from the database
    if (!found)
      await db.delete(servers).where(eq(servers.uri, server.uri as string));
  }

  // Loop through every connection from Plex
  const connectionsPromises = plexServerConnections.map(async (connection) => {
    // Check if there is already a valid connection in the database for the server
    const exists = await db
      .select()
      .from(servers)
      .where(
        and(
          eq(servers.guid, connection.guid as string),
          eq(servers.active, true)
        )
      );
    if (exists.length) {
      if (exists[0].uri === connection.uri) {
        return exists[0];
      } else {
        // Short circuit, we don't need to check the connection
        return {
          uri: connection.uri,
          active: false,
          guid: connection.guid,
        };
      }
    } else {
      // Check if the connection is already in the database
      const exists = await db
        .select()
        .from(servers)
        .where(eq(servers.uri, connection.uri as string));
      if (exists.length) {
        return exists[0];
      } else {
        return checkConnection(connection);
      }
    }
  });

  const connections = (await Promise.allSettled(connectionsPromises))
    .filter((promise) => promise.status === "fulfilled")
    .map((promise) => promise.value);

  // Loop through every connection
  for (const connection of connections) {
    // Check if the connection is already in the database
    const found = dbServers.find((server) => server.uri === connection.uri);

    // If the connection is not found, add it to the database
    if (!found) await db.insert(servers).values(connection);
    // Otherwise, update the server
    else
      await db
        .update(servers)
        .set({ active: connection.active })
        .where(eq(servers.uri, connection.uri as string));
  }
};

const updatePlayback = async () => {
  // Fetch the current user ID from Plex
  const userID = await fetchUserID();

  // Get the current playback sessions in the database
  const dbPlayback = await db.select().from(playback).all();

  // Get the servers from the database where the server is active
  const connections = await db
    .select()
    .from(servers)
    .where(eq(servers.active, true))
    .all();

  const sessions = [];
  const toDelete = [];

  // Loop through every connection
  for (const connection of connections) {
    // Fetch the sessions from the server
    const _sessions = await fetchSessions(connection);

    // If we have any sessions
    if (_sessions)
      // Filter out the sessions that are not from the current user and add them to the sessions array
      sessions.push(
        ..._sessions.filter((session: any) => session.userID === "1")
      );
  }

  // Loop through every session in the database
  for (const session of dbPlayback) {
    // Check if the session is still in the active sessions
    const found = sessions.find((s) => s.guid === session.guid);

    // If the session is not found, delete it from the database
    if (!found) toDelete.push(session.guid as string);
  }

  if (toDelete.length)
    await db.delete(playback).where(inArray(playback.guid, toDelete)).execute();

  // Loop through every session
  for (const session of sessions) {
    // Check if the session is already in the database
    const found = dbPlayback.find((s) => s.guid === session.guid);

    // If the session is not found, add it to the database
    if (!found) await db.insert(playback).values(session);
  }
};

const updatePresence = async () => {
  // Get the playback sessions from the database
  const playbackData = await db.select().from(playback).all();

  // Check what our current presence is
  const { activities } = await checkDiscordPresence();

  // Unfortunatly, we can't have multiple activities at the same time
  const session = playbackData[0];

  if (session) {
    const state = `${session.parentTitle} • Episode ${session.index}`;
    const name = session.grandparentTitle as string;

    // Check if the presence is already in the activities
    const found = activities.find(
      (activity: any) => activity.state === state && activity.name === name
    );

    if (!found) {
      const presence = await createDiscordPresence({
        state,
        name,
      });

      await setDiscordPresence(presence);
    }
  } else {
    // Check if we have any activities
    if (activities.length) {
      // Clear the presence
      await setDiscordPresence(null);
    }
  }
};

await updateServers();
await updatePlayback();
await loginToDiscord(Bun.env.DISCORD_TOKEN as string);
await updatePresence();

// // Start the jobs
Cron("*/10 * * * *", updateServers);
Cron("*/1 * * * *", updatePlayback);
Cron("*/15 * * * * *", updatePresence);
