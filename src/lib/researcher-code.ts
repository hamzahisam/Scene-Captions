import { z } from 'zod';

export const researcherCodeSchema = z.string().regex(/^\d{4,8}$/, 'Use a researcher code of 4–8 digits.');
export const researcherCredentialSchema = z.object({
  algorithm: z.literal('salted-sha256'),
  salt: z.string().regex(/^[a-f0-9]{32}$/),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
});
export type ResearcherCredential = z.infer<typeof researcherCredentialSchema>;
const hex = (bytes: Uint8Array) => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
async function digest(code: string, salt: string) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${code}`))));
}

// This deters casual access; it is not a security boundary. The registry and code
// checker are browser-local and a person with developer tools can bypass them.
export async function hashResearcherCode(code: string): Promise<ResearcherCredential> {
  researcherCodeSchema.parse(code);
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return { algorithm: 'salted-sha256', salt, hash: await digest(code, salt) };
}
export async function verifyResearcherCode(code: string, credential: unknown): Promise<boolean> {
  const parsed = researcherCredentialSchema.safeParse(credential);
  if (!researcherCodeSchema.safeParse(code).success || !parsed.success) return false;
  const actual = await digest(code, parsed.data.salt);
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ parsed.data.hash.charCodeAt(i);
  return difference === 0;
}
