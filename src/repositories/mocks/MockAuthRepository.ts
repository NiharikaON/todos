import { IAuthRepository, User } from "../interfaces";

const MOCK_USER: User = {
  id: "mock-user-123",
  email: "test@example.com",
  name: "Mock User",
};

export class MockAuthRepository implements IAuthRepository {
  private currentUser: User | null = null;

  async login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          this.currentUser = MOCK_USER;
          // Store in localStorage for persistence across reloads
          if (typeof window !== "undefined") {
            localStorage.setItem("mock_session", JSON.stringify(MOCK_USER));
          }
          resolve(MOCK_USER);
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 800);
    });
  }

  async register(email: string, password: string): Promise<User> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = { id: "mock-new-user", email, name: email.split('@')[0] };
        if (typeof window !== "undefined") {
          localStorage.setItem("mock_session", JSON.stringify(this.currentUser));
        }
        resolve(this.currentUser);
      }, 800);
    });
  }

  async logout(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.currentUser = null;
        if (typeof window !== "undefined") {
          localStorage.removeItem("mock_session");
        }
        resolve();
      }, 400);
    });
  }

  async getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!this.currentUser && typeof window !== "undefined") {
          const session = localStorage.getItem("mock_session");
          if (session) {
            this.currentUser = JSON.parse(session);
          }
        }
        resolve(this.currentUser);
      }, 200);
    });
  }

  async forgotPassword(email: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: forgot password code sent to ${email}`);
        resolve();
      }, 500);
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: password reset for ${email} with code ${code}`);
        resolve();
      }, 800);
    });
  }

  async confirmSignUp(email: string, code: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: confirmed sign up for ${email} with code ${code}`);
        resolve();
      }, 500);
    });
  }

  async resendConfirmationCode(email: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: resent confirmation code to ${email}`);
        resolve();
      }, 500);
    });
  }

  async setupMFA(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("mock-totp-secret-key");
      }, 500);
    });
  }

  async verifyMFA(code: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: verified MFA code ${code}`);
        resolve();
      }, 500);
    });
  }

  async refreshSession(): Promise<User | null> {
    return this.getCurrentUser();
  }

  async updateProfile(name: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser) {
          this.currentUser.name = name;
          if (typeof window !== "undefined") {
            localStorage.setItem("mock_session", JSON.stringify(this.currentUser));
          }
        }
        resolve();
      }, 500);
    });
  }

  async updateAvatar(url: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser) {
          this.currentUser.avatarUrl = url;
          if (typeof window !== "undefined") {
            localStorage.setItem("mock_session", JSON.stringify(this.currentUser));
          }
        }
        resolve();
      }, 500);
    });
  }

  async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Mock: updated password`);
        resolve();
      }, 500);
    });
  }

  async updatePreferences(preferences: Record<string, boolean>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.currentUser) {
          this.currentUser.preferences = {
            ...this.currentUser.preferences,
            ...preferences
          };
          if (typeof window !== "undefined") {
            localStorage.setItem("mock_session", JSON.stringify(this.currentUser));
          }
        }
        resolve();
      }, 500);
    });
  }
}

export const authRepository = new MockAuthRepository();
