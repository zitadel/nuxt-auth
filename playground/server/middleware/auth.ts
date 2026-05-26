import { createError, eventHandler } from 'h3';
import { getSession } from '~~/server/auth';

export default eventHandler(async (event) => {
  // Only protect a certain backend route
  if (!event.node.req.url?.startsWith('/api/protected/middleware')) {
    return;
  }

  const session = await getSession(event);
  if (!session) {
    throw createError({ message: 'Unauthenticated', statusCode: 403 });
  }
});
