import { UserData, constructEmptyUserData } from "@/classes/UserData";
import AvatarCard from "@/components/AvatarCard";
import AvatarCardWrapper from "@/components/svg/AvatarCardWrapper";
import MenuBar from "@/components/svg/MenuBar";
import useFirestoreData, { FirestoreDataType } from "@/hooks/useFirestoreData";
import { User, signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { createContext, useState } from "react";
import { auth, db } from "../firebase";
import RegisterPage from "../register";
import SizedBox from "@/components/SizedBox";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import MyButton from "@/components/MyButton";

export const MainPageContext = createContext({
  user: {} as User,
  userData: {} as FirestoreDataType<UserData>,
  setIsEditingUserData: {} as React.Dispatch<React.SetStateAction<boolean>>,
});

interface MainPageInterface {
  user: User;
}

const MainPage: React.FC<MainPageInterface> = ({ user }) => {
  const [isEditingUserData, setIsEditingUserData] = useState(false);
  const userData = useFirestoreData(
    doc(db, "users", user.uid),
    constructEmptyUserData
  );

  if (!userData.uid || isEditingUserData) {
    return (
      <MainPageContext.Provider
        value={{ user, userData, setIsEditingUserData }}
      >
        <RegisterPage
          isEditingUserData={isEditingUserData}
          setIsEditingUserData={setIsEditingUserData}
        />
      </MainPageContext.Provider>
    );
  }

  return (
    <div className="py-4 px-4">
      <MainPageContext.Provider
        value={{ user, userData, setIsEditingUserData }}
      >
        <Popup
          trigger={
            <button>
              {" "}
              <MenuBar />
            </button>
          }
          offsetY={10}
          position="bottom left"
        >
          <div className="w-full flex justify-center py-2 px-1">
            <MyButton
              label="Sign Out"
              color="bg-white"
              borderColor="border border-red"
              textColor="text-red"
              pX={2}
              pY={0.5}
              onClick={() => {
                signOut(auth);
              }}
            />
          </div>
        </Popup>

        <SizedBox height={10} />
        <AvatarCard />
      </MainPageContext.Provider>
    </div>
  );
};

export default MainPage;
