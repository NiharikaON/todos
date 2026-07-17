import { IAuthRepository, User } from "@/repositories/interfaces";
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  setUpTOTP,
  verifyTOTPSetup,
  fetchAuthSession,
  updateUserAttribute,
  updatePassword as updateCognitoPassword
} from "aws-amplify/auth";

export class AmplifyAuthAdapter implements IAuthRepository {
  private mapError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return new Error(error.message);
    }
    return new Error(defaultMessage);
  }

  async login(email: string, password: string): Promise<User> {
    try {
      const { isSignedIn, nextStep } = await signIn({ username: email, password });
      if (isSignedIn) {
        return await this.getCurrentUser() as User;
      }
      if (nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error("CONFIRM_SIGN_UP_REQUIRED");
      }
      throw new Error("Sign in failed - additional steps required");
    } catch (error: any) {
      if (error?.message?.includes("already a signed in user") || error?.name === "NotAuthorizedException") {
        try {
          // If we are stuck in an already signed in state, force sign out and retry
          await signOut();
          const retry = await signIn({ username: email, password });
          if (retry.isSignedIn) {
            return await this.getCurrentUser() as User;
          }
        } catch (retryError) {
          // Ignore retry error
        }
      }

      throw this.mapError(error, "Failed to login");
    }
  }

  async register(email: string, password: string): Promise<User> {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
          },
        },
      });

      return {
        id: userId || email,
        email,
      };
    } catch (error) {
      throw this.mapError(error, "Failed to register");
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut();
    } catch (error) {
      throw this.mapError(error, "Failed to logout");
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      let preferences: Record<string, boolean> | undefined;
      if (attributes.profile) {
        try {
          preferences = JSON.parse(attributes.profile);
        } catch (e) {
          // Ignore parse errors
        }
      }

      return {
        id: currentUser.userId,
        email: attributes.email || "",
        name: attributes.name || (attributes.email ? attributes.email.split('@')[0] : "User"),
        avatarUrl: attributes.picture,
        preferences,
      };
    } catch (error) {
      // User is not authenticated, silently return null
      // Removed console.error to prevent Next.js dev overlay from popping up for expected unauthenticated states
      return null;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      await resetPassword({ username: email });
    } catch (error) {
      throw this.mapError(error, "Failed to initiate password reset");
    }
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    try {
      await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
    } catch (error) {
      throw this.mapError(error, "Failed to reset password");
    }
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      throw this.mapError(error, "Failed to confirm sign up");
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      throw this.mapError(error, "Failed to resend confirmation code");
    }
  }

  async setupMFA(): Promise<string> {
    try {
      const totpSetupDetails = await setUpTOTP();
      return totpSetupDetails.sharedSecret;
    } catch (error) {
      throw this.mapError(error, "Failed to setup MFA");
    }
  }

  async verifyMFA(code: string): Promise<void> {
    try {
      await verifyTOTPSetup({ code });
    } catch (error) {
      throw this.mapError(error, "Failed to verify MFA");
    }
  }

  async refreshSession(): Promise<User | null> {
    try {
      await fetchAuthSession({ forceRefresh: true });
      return await this.getCurrentUser();
    } catch (error) {
      return null;
    }
  }

  async updateProfile(name: string): Promise<void> {
    try {
      await updateUserAttribute({
        userAttribute: {
          attributeKey: 'name',
          value: name
        }
      });
    } catch (error) {
      throw this.mapError(error, "Failed to update profile");
    }
  }

  async updateAvatar(url: string): Promise<void> {
    try {
      await updateUserAttribute({
        userAttribute: {
          attributeKey: 'picture',
          value: url
        }
      });
    } catch (error) {
      throw this.mapError(error, "Failed to update avatar");
    }
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await updateCognitoPassword({
        oldPassword,
        newPassword
      });
    } catch (error) {
      throw this.mapError(error, "Failed to update password");
    }
  }

  async updatePreferences(preferences: Record<string, boolean>): Promise<void> {
    try {
      await updateUserAttribute({
        userAttribute: {
          attributeKey: 'profile',
          value: JSON.stringify(preferences)
        }
      });
    } catch (error) {
      throw this.mapError(error, "Failed to update preferences");
    }
  }
}
