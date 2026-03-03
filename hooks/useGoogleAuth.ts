import { useEffect, useState } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { useAuth } from "@/hooks/useAuth";
import { getFirebaseErrorMessage } from "@/utils/validation";

WebBrowser.maybeCompleteAuthSession();

const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId;
const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId;

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

/** iOS Client ID의 reversed URL scheme을 redirect URI로 사용 */
function getIosRedirectUri(clientId: string): string {
  const reversed = clientId.split(".").reverse().join(".");
  return `${reversed}:/oauthredirect`;
}

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUri = googleIosClientId
    ? getIosRedirectUri(googleIosClientId)
    : "";

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleIosClientId ?? "",
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: "code",
      usePKCE: true,
    },
    discovery
  );

  useEffect(() => {
    if (response?.type !== "success") return;

    const code = response.params?.code;
    if (!code || !request?.codeVerifier || !redirectUri) return;

    setLoading(true);
    setError("");

    AuthSession.exchangeCodeAsync(
      {
        clientId: googleIosClientId!,
        code,
        redirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      discovery
    )
      .then((tokenResponse) => {
        const idToken = tokenResponse.idToken;
        if (!idToken) throw new Error("ID Token을 받지 못했습니다.");
        return loginWithGoogle(idToken);
      })
      .catch((err: any) => {
        const code = err?.code ?? "";
        setError(code ? getFirebaseErrorMessage(code) : err.message);
      })
      .finally(() => setLoading(false));
  }, [response, request, redirectUri, loginWithGoogle]);

  const signIn = async () => {
    setError("");
    await promptAsync();
  };

  return {
    signIn,
    loading,
    error,
    disabled: !request,
  };
}
