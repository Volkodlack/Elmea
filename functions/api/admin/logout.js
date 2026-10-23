import { clearCookie, revokeSessions } from '../../_lib/auth.js';
import { json } from '../../_lib/util.js';

export async function onRequestPost({ data }) {
  await revokeSessions(data.db);
  return json({ ok: true }, 200, { 'Set-Cookie': clearCookie });
}
