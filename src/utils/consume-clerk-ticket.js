/** Consume a one-time Clerk sign-in token on this origin. Do not log the token. */
export async function consumeClerkTicket({ signIn, setActive, ticket }) {
  if (!ticket || !signIn || !setActive) return false;
  const attempt = await signIn.create({ strategy: "ticket", ticket });
  if (attempt.status === "complete" && attempt.createdSessionId) {
    await setActive({ session: attempt.createdSessionId });
    return true;
  }
  return false;
}
