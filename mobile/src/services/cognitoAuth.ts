import { COGNITO_APP_CLIENT_ID, COGNITO_ENDPOINT } from '../config/auth';
import { AuthTokens } from '../types/auth';

type CognitoErrorResponse = {
  __type?: string;
  message?: string;
};

type CognitoAuthResult = {
  AuthenticationResult?: {
    AccessToken: string;
    IdToken: string;
    RefreshToken?: string;
    ExpiresIn: number;
    TokenType: string;
  };
};

function getCognitoMessage(error: CognitoErrorResponse) {
  if (error.message) {
    return error.message;
  }

  if (error.__type) {
    return error.__type.split('#').pop() ?? 'Cognito request failed.';
  }

  return 'Cognito request failed.';
}

async function callCognito<T>(target: string, payload: Record<string, unknown>) {
  const response = await fetch(COGNITO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(getCognitoMessage(body as CognitoErrorResponse));
  }

  return body as T;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toAuthTokens(result: CognitoAuthResult): AuthTokens {
  if (!result.AuthenticationResult) {
    throw new Error('Cognito did not return an auth session.');
  }

  return {
    accessToken: result.AuthenticationResult.AccessToken,
    idToken: result.AuthenticationResult.IdToken,
    refreshToken: result.AuthenticationResult.RefreshToken,
    expiresIn: result.AuthenticationResult.ExpiresIn,
    tokenType: result.AuthenticationResult.TokenType,
  };
}

export async function signUpWithEmail(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  return callCognito('SignUp', {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: normalizedEmail,
    Password: password,
    UserAttributes: [
      {
        Name: 'email',
        Value: normalizedEmail,
      },
    ],
  });
}

export async function confirmEmailSignUp(email: string, code: string) {
  return callCognito('ConfirmSignUp', {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: normalizeEmail(email),
    ConfirmationCode: code.trim(),
  });
}

export async function signInWithEmail(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);

  const result = await callCognito<CognitoAuthResult>('InitiateAuth', {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_APP_CLIENT_ID,
    AuthParameters: {
      USERNAME: normalizedEmail,
      PASSWORD: password,
    },
  });

  return {
    user: {
      email: normalizedEmail,
    },
    tokens: toAuthTokens(result),
  };
}

export async function requestPasswordReset(email: string) {
  return callCognito('ForgotPassword', {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: normalizeEmail(email),
  });
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string
) {
  return callCognito('ConfirmForgotPassword', {
    ClientId: COGNITO_APP_CLIENT_ID,
    Username: normalizeEmail(email),
    ConfirmationCode: code.trim(),
    Password: newPassword,
  });
}

export async function globalSignOut(accessToken: string) {
  return callCognito('GlobalSignOut', {
    AccessToken: accessToken,
  });
}
