export async function copyCurrentPageUrlToClipboard() {
  const maybeWindow = (globalThis as { window?: Window }).window;
  const url = maybeWindow?.location?.href;

  if (!url) {
    throw new Error("Ссылка доступна только в веб-версии");
  }

  if (maybeWindow.navigator.clipboard?.writeText) {
    try {
      await maybeWindow.navigator.clipboard.writeText(url);
      return;
    } catch {
      // Fall through to the textarea fallback for browsers that expose the API
      // but deny it outside a secure/user-activated context.
    }
  }

  const maybeDocument = (globalThis as { document?: Document }).document;
  if (!maybeDocument?.body) {
    throw new Error("Не удалось получить доступ к буферу обмена");
  }

  const textarea = maybeDocument.createElement("textarea");
  textarea.value = url;
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  textarea.style.position = "fixed";
  textarea.style.top = "-9999px";

  maybeDocument.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const didCopy = maybeDocument.execCommand("copy");
    if (!didCopy) {
      throw new Error("Браузер не разрешил копирование");
    }
  } finally {
    maybeDocument.body.removeChild(textarea);
  }
}
