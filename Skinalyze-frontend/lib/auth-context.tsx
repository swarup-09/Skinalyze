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

type UserDocument = Models.Document & UserData;

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
    if (user && !userData) {
      fetchUserData();
    }

    // NOTE: If you decide to remove this useEffect entirely and manage fetchUserData
    // manually inside `signIn` and `getUser`, it would be even cleaner!
    // For now, we keep it as a fallback for initial load/sign-in.
  }, [user, userData]);

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
      const newUser = await account.create(ID.unique(), email, password, name);
      console.log("User created successfully:", newUser.$id);

      //Sign in the user to create session (This sets the global user state via signIn)
      await account.createEmailPasswordSession(email, password);

      // Fetch logged-in user to ensure session is valid and get the latest user object
      const sessionUser = await account.get();
      console.log("Session user:", sessionUser.$id);

      // Store additional user info in database
      // CRITICAL step to ensure the document exists before the UI tries to read it.
      const initialUserData = {
        userId: sessionUser.$id,
        fullName: sessionUser.name || name,
        dob: "",
        gender: "Not Specified",
        phone: "",
        altphone: "",
      };

      try {
        const userDoc: UserDocument = await databases.createDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          sessionUser.$id, // Use user ID as document ID
          initialUserData,
          [
            Permission.read(Role.user(sessionUser.$id)),
            Permission.write(Role.user(sessionUser.$id)),
            Permission.delete(Role.user(sessionUser.$id)),
          ]
        );
        console.log("User data stored in database:", userDoc.$id);

        setUser(sessionUser);
        setUserData({
          fullName: userDoc.fullName,
          dob: userDoc.dob,
          gender: userDoc.gender,
          phone: userDoc.phone,
          altphone: userDoc.altphone,
          userId: userDoc.userId,
        });

      } catch (dbError) {
        console.error("Database error during document creation:", dbError);
        setUser(sessionUser);
        setUserData(initialUserData); // Set defaults to avoid a blank screen
      }
      //verification email
      await account.createVerification({
        url: 'https://swarup-09.github.io/accounts.skinalyze/'
      });

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

      const sessionUser = await account.get();

      // Update state
      setUser(sessionUser);

      // an existing user, need to explicitly fetch data immediately for faster UX.
      await fetchUserData(sessionUser.$id);

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

  // Allow passing an optional userId for immediate fetch (used in signIn)
  const fetchUserData = async (userId: string | undefined = user?.$id) => {
    if (!userId) return;
    setIsLoadingUserData(true);
    try {
      const document: UserDocument = await databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        userId
      );
      setUserData({
        fullName: document.fullName || "",
        dob: document.dob || "",
        gender: document.gender || "",
        phone: document.phone || "",
        altphone: document.altphone || "",
        userId: document.userId || userId,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Fallback to user data from account if document is truly not found
      setUserData({
        fullName: user?.name || "",
        dob: "",
        gender: "",
        phone: "",
        altphone: "",
        userId: userId,
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
      // Ensure userData is updated with the new, confirmed data
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