// Define el ID de la aplicación en una constante para mantenerlo centralizado.
const UNO_APP_ID = 'app_a4f7f3e62c1de0b9490a5260cb390b56';

// Define la interfaz para los parámetros de la función.
interface GetUnoDeeplinkUrlParams {
  fromToken?: string;
  toToken?: string;
  amount?: string;
  referrerAppId?: string;
  referrerDeeplinkPath?: string;
}

/**
 * Genera la URL de deeplink para la aplicación UNO.
 * @param {GetUnoDeeplinkUrlParams} params - Los parámetros para construir la URL.
 * @returns {string} La URL de deeplink generada.
 */
export function getUnoDeeplinkUrl({
  fromToken,
  toToken,
  amount,
  referrerAppId,
  referrerDeeplinkPath,
}: GetUnoDeeplinkUrlParams): string {
  let path = `?tab=swap`;

  if (fromToken) {
    path += `&fromToken=${fromToken}`;
    if (amount) {
      path += `&amount=${amount}`;
    }
  }

  if (toToken) {
    path += `&toToken=${toToken}`;
  }

  if (referrerAppId) {
    path += `&referrerAppId=${referrerAppId}`;
  }

  if (referrerDeeplinkPath) {
    // Es crucial codificar el componente de la ruta para evitar errores en la URL.
    path += `&referrerDeeplinkPath=${encodeURIComponent(referrerDeeplinkPath)}`;
  }

  // Se codifica toda la ruta de parámetros antes de añadirla a la URL principal.
  const encodedPath = encodeURIComponent(path);

  return `https://worldcoin.org/mini-app?app_id=${UNO_APP_ID}&path=${encodedPath}`;
}