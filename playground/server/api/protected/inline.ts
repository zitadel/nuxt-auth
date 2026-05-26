import { eventHandler } from 'h3';
import { getSession } from '~~/server/auth';

export default eventHandler(async (event) => {
  const session = await getSession(event);
  if (!session) {
    return { status: 'unauthenticated!' };
  }
  return {
    status: 'authenticated!',
    text: 'im protected by an in-endpoint check',
    session,
  };
});
