import { UserData, constructEmptyUserData } from "@/classes/UserData";
import AvatarCard from "@/components/AvatarCard";
import useFirestoreData, { FirestoreDataType } from "@/hooks/useFirestoreData";
import { User } from "firebase/auth";
import { doc } from "firebase/firestore";
import { createContext, useContext, useState } from "react";
import { db } from "../firebase";
import RegisterPage from "../register";
import SizedBox from "@/components/SizedBox";
import MenuBar from "@/components/MenuBar";

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
        <MenuBar />
        <SizedBox height={10} />
        <AvatarCard />
        <HealthGrid />
      </MainPageContext.Provider>
    </div>
  );
};

interface HealthGridProps {}

const HealthGrid: React.FC<HealthGridProps> = () => {
  const { userData } = useContext(MainPageContext);

  return (
    <div className="flex flex-col w-full mt-10">
      <div className="flex m-auto">
        <HealthBox value={`${userData.weight}`} units="kg" name="Weight" />
        <HealthBox value={`${userData.height}`} units="cm" name="Height" />
      </div>
      <div className="flex m-auto">
        <HealthBox
          value={`${userData.temperature}`}
          units="°C"
          name="Temperature"
        />
        <HealthBox
          value={`${userData.heart_rate}`}
          units="bpm"
          name="Heart Rate"
        />
      </div>
      <div className="flex m-auto">
        <HealthBox
          value={`${userData.blood_oxygen}`}
          units="%"
          name="Blood Oxygen"
        />
        <HealthBox
          value={`${userData.blood_pressure}`}
          units="mmHg"
          name="Blood Pressure"
        />
      </div>
    </div>
  );
};

interface HealthBoxProps {
  value: string;
  units: string;
  name: string;
}

const HealthBox: React.FC<HealthBoxProps> = ({ value, units, name }) => {
  return (
    <div className="w-32 h-32 border border-darker_secondary px-3 py-4 flex flex-col justify-between">
      <div className="relative w-min">
        <p className="text-5xl font-light">{value}</p>
        <div className="absolute top-0" style={{ left: `calc(100% + 2px)` }}>
          <p className="text-base font-base">{units}</p>
        </div>
      </div>
      <p className="text-sm font-base">{name}</p>
    </div>
  );
};

export default MainPage;
