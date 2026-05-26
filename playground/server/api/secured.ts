import { createError, eventHandler } from 'h3';
import { getSession } from '~~/server/auth';

export default eventHandler(async (event) => {
  const session = await getSession(event);
  if (!session) {
    throw createError({ statusCode: 403, message: 'Unauthenticated' });
  }
  return { status: 'ok', session };
});
