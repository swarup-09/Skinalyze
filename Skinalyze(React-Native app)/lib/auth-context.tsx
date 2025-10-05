import { createContext, useContext, useEffect, useState } from "react";
import { Alert } from "react-native";
import { ID, Models, Permission, Role } from "react-native-appwrite";
import { account, DATABASE_ID, databases, USERS_COLLECTION_ID } from "./appwrite";

type UserData = {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  altphone: string;
  userId: string;
};

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  userData: UserData | null;
  isLoadingUser: boolean;
  isLoadingUserData: boolean;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPasswordRequest: (email: string) => Promise<string | null>;
  fetchUserData: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isLoadingUserData, setIsLoadingUserData] = useState<boolean>(false);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // 1️⃣ Create user account
      const user = await account.create(ID.unique(), email, password, name);
      console.log("User created successfully:", user.$id);

      // 2️⃣ Sign in the user to create session
      const signInError = await signIn(email, password);
      if (signInError) {
        throw new Error(signInError);
      }

      // 3️⃣ Fetch logged-in user to ensure session is valid
      const sessionUser = await account.get();
      console.log("Session user:", sessionUser.$id);

      // 4️⃣ Send verification email
      await account.createVerification({
        url: 'https://swarup-09.github.io/accounts.skinalyze/'
      });

      // 5️⃣ Store additional user info in database
      try {
        const userDoc = await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          sessionUser.$id, // Use user ID as document ID
          {
            userId: sessionUser.$id,
            fullName: sessionUser.name || name,
            dob: "",
            gender: "Not Specified",
            phone: "",
            altphone: "",
          },
          [
            Permission.read(Role.user(sessionUser.$id)),
            Permission.write(Role.user(sessionUser.$id)),
            Permission.delete(Role.user(sessionUser.$id)),
          ]
        );
        console.log("User data stored in database:", JSON.stringify(userDoc));
      } catch (dbError) {
        console.error("Database error:", dbError);
        // Don't throw here - user account is created, just DB storage failed
      }

      Alert.alert(
        "Verify your email",
        "We've sent a verification link to your email. Please check your inbox."
      );

      return null;
    } catch (error) {
      console.error("SignUp error:", error);
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred during signup";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const session = await account.get();
      setUser(session);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred during sign in";
    }
  };

  const resetPasswordRequest = async (email: string) => {
    try {
      await account.createRecovery(
        email,
        "https://swarup-09.github.io/accounts.skinalyze/forgot-password"
      );
      Alert.alert("Password Reset", "We sent you a reset link. Please check your email.");
      return null;
    } catch (error) {
      if (error instanceof Error) return error.message;
      return "An error occurred during password reset request. Try again later";
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    setIsLoadingUserData(true);
    try {
      const document = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id
      );
      setUserData({
        fullName: document.fullName || "",
        dob: document.dob || "",
        gender: document.gender || "",
        phone: document.phone || "",
        altphone: document.altphone || "",
        userId: document.userId || user.$id,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set default values if document doesn't exist
      setUserData({
        fullName: user.name || "",
        dob: "",
        gender: "",
        phone: "",
        altphone: "",
        userId: user.$id,
      });
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return "User not authenticated";
    try {
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        data
      );
      setUserData(prev => prev ? { ...prev, ...data } : null);
      console.log("User data updated:", updatedDoc);
      return null;
    } catch (error) {
      console.error("Error updating user data:", error);
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred while updating user data";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isLoadingUser,
        isLoadingUserData,
        signUp,
        signIn,
        signOut,
        resetPasswordRequest,
        fetchUserData,
        updateUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be inside of the AuthProvider");
  }
  return context;
}
