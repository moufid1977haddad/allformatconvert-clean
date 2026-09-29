// AI text tools, browser side (audit 2, 29/09).

// A gateway or timeout error page is HTML, not JSON: response.json() threw "Unexpected token '<'", shown as is.
export async function readAiJson(response) {
  try {
    return await response.json();
  } catch {
    return { error: `The AI service did not answer correctly (HTTP ${response.status}). Try again in a moment.` };
  }
}

// AI Chatbot: each message used to be sent alone, so the model had no memory of the conversation shown on screen
// ("And its population?" after a question about France was answered blind). The server accepts only one prompt
// (no message list: that closes the route to free-form use of the key), so the most recent turns are written into
// the prompt, newest kept first, within the same character limit as any prompt.
export function chatPrompt(history, message, maxChars) {
  const lines = [];
  let budget = maxChars - message.length - 120;
  for (let i = history.length - 1; i >= 0; i--) {
    const line = `${history[i].role === 'user' ? 'User' : 'Assistant'}: ${history[i].text}`;
    if (line.length + 1 > budget) break;
    lines.unshift(line);
    budget -= line.length + 1;
  }
  if (!lines.length) return message;
  return `Conversation so far:\n${lines.join('\n')}\n\nThe user now says:\n${message}`;
}
