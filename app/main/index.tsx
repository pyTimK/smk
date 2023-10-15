import { UserData, constructEmptyUserData } from "@/classes/UserData";
import AvatarCard from "@/components/AvatarCard";
import useFirestoreData, { FirestoreDataType } from "@/hooks/useFirestoreData";
import { User } from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebase";
import RegisterPage from "../register";
import SizedBox from "@/components/SizedBox";
import MenuBar from "@/components/MenuBar";
import MyButton from "@/components/MyButton";
import { useZxing } from "react-zxing";
import { SimpleDialogContainer, simpleAlert } from "react-simple-dialogs";
import Modal from "react-modal";
import { Constants } from "../constants";
import { DeviceData } from "@/classes/DeviceData";
import MeasuringPageWrapper from "../measuring";
import { toZeroIfNAN } from "@/myfunctions/formatNumber";
import isAdmin from "@/myfunctions/isAdmin";
import FirebaseHelper from "@/classes/FirebaseHelper";
import getAge from "@/myfunctions/getAge";

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
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const userData = useFirestoreData(
    doc(db, "users", user.uid),
    constructEmptyUserData
  );

  const [userDataList, setUserDataList] = useState<UserData[]>([]);

  useEffect(() => {
    if (isAdmin(userData)) {
      FirebaseHelper.getAllUserData().then((data) => {
        setUserDataList(data);
      });
    }
  }, [userData.uid]);

  console.log("USER_DATAAAAAAAAAAAAAAAAAAAAAAA");
  console.log(userData);

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

  if (userData.is_measuring) {
    return (
      <MainPageContext.Provider
        value={{ user, userData, setIsEditingUserData }}
      >
        <MeasuringPageWrapper isDevice={false} />
      </MainPageContext.Provider>
    );
  }

  const lastMeasuredDate = (
    (userData.record_date as Date) ?? new Date()
  ).toLocaleDateString("en-US", lastMeasuredDateOption);

  function openModal() {
    setModalIsOpen(true);
  }

  function afterOpenModal() {}

  function closeModal() {
    setModalIsOpen(false);
  }

  console.log(userData);

  return (
    <div className="px-4 py-4">
      <MainPageContext.Provider
        value={{ user, userData, setIsEditingUserData }}
      >
        <MenuBar />
        <SizedBox height={10} />
        <AvatarCard />
        {!isAdmin(userData) && userData.weight !== 0 && (
          <HealthGrid userData={userData} />
        )}
        {!isAdmin(userData) && (
          <div className="flex flex-col items-center justify-center mt-10 space-y-3">
            <MyButton
              label="Measure"
              onClick={() => {
                openModal();
              }}
              pX={5}
              roundedSize="rounded-full"
            />
            {userData.weight !== 0 && (
              <p className="ml-4 text-xs font-light">
                Last Measured: {lastMeasuredDate}
              </p>
            )}
          </div>
        )}
        {isAdmin(userData) && (
          <div className="mt-10 mb-5">
            <p className="text-2xl font-bold">All Users</p>
          </div>
        )}
        {isAdmin(userData) && (
          <div className="flex flex-col gap-5 mb-10">
            {userDataList
              .filter((userData) => !isAdmin(userData))
              .map((userData) => {
                return (
                  <div className="flex flex-col gap-5 border rounded-2xl border-darker_primary py-5 px-3">
                    <div className="flex justify-between">
                      <p className="text-xl font-bold">
                        {userData.first_name} {userData.last_name}
                      </p>
                      <p>{userData.sex}</p>
                    </div>
                    <hr />
                    <div className="flex flex-col text-xl gap-6">
                      <div className="flex flex-row">
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedWeight(userData)}</p>
                          <p className="text-xs">kg</p>
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedHeight(userData)}</p>
                          <p className="text-xs">cm</p>
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedTemperature(userData)}</p>
                          <p className="text-xs">°C</p>
                        </div>
                      </div>
                      <div className="flex flex-row justify-between">
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedHeartRate(userData)}</p>
                          <p className="text-xs">bpm</p>
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedBloodOxygen(userData)}</p>
                          <p className="text-xs">%spO2</p>
                        </div>
                        <div className="flex flex-1 flex-col items-center">
                          <p>{getFormattedBloodPressure(userData)}</p>
                          <p className="text-xs">mmHg</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
        <SimpleDialogContainer />
        <Modal
          isOpen={modalIsOpen}
          className="absolute inset-0 px-5 py-5 text-white -translate-x-1/2 -translate-y-1/2 bg-darker_primary rounded-xl w-fit h-fit top-1/2 left-1/2"
          onAfterOpen={afterOpenModal}
          onRequestClose={closeModal}
          // style={customStyles}
          contentLabel="Example Modal"
        >
          <p className="mb-5 text-2xl font-light whitespace-nowrap">
            Scan Device QR
          </p>
          <BarcodeScanner closeModal={closeModal} />
        </Modal>
      </MainPageContext.Provider>
    </div>
  );
};

interface BarCodeScannerProps {
  closeModal: () => void;
}

const BarcodeScanner: React.FC<BarCodeScannerProps> = ({ closeModal }) => {
  const [result, setResult] = useState("");
  const { userData } = useContext(MainPageContext);
  const { ref } = useZxing({
    onDecodeResult(result) {
      setResult(result.getText());
    },
  });

  useEffect(() => {
    if (result === Constants.qrCode) {
      userData.updateData({
        is_measuring: true,
      });

      setDoc(doc(db, "devices", Constants.qrCode), {
        is_measuring: true,
        user_id: userData.uid,
      } as DeviceData);
      closeModal();
    }
  }, [result]);

  return (
    <>
      <video ref={ref} />
    </>
  );
};

function getFormattedWeight(userData: UserData) {
  if (!userData.weight || Number.isNaN(userData.weight)) {
    return "0";
  } else {
    return userData.weight.toFixed(0);
  }
}

function getFormattedHeight(userData: UserData) {
  if (!userData.height || Number.isNaN(userData.height)) {
    return "0";
  } else {
    return userData.height.toFixed(0);
  }
}

function getFormattedTemperature(userData: UserData) {
  if (!userData.temperature || Number.isNaN(userData.temperature)) {
    return "0";
  } else {
    return userData.temperature.toFixed(0);
  }
}

function getFormattedHeartRate(userData: UserData) {
  if (!userData.heart_rate || Number.isNaN(userData.heart_rate)) {
    return "0";
  } else {
    return userData.heart_rate.toFixed(0);
  }
}

function getFormattedBloodOxygen(userData: UserData) {
  if (!userData.blood_oxygen || Number.isNaN(userData.blood_oxygen)) {
    return "0";
  } else {
    return userData.blood_oxygen.toFixed(0);
  }
}

function getFormattedBloodPressure(userData: UserData) {
  if (
    !userData.blood_pressure_diastolic ||
    Number.isNaN(userData.blood_pressure_diastolic) ||
    !userData.blood_pressure_systolic ||
    Number.isNaN(userData.blood_pressure_systolic)
  ) {
    return "0/0";
  } else {
    return (
      userData.blood_pressure_diastolic.toFixed(0) +
      "/" +
      userData.blood_pressure_systolic.toFixed(0)
    );
  }
}

interface HealthGridProps {
  userData: FirestoreDataType<UserData>;
}

export const HealthGrid: React.FC<HealthGridProps> = ({ userData }) => {
  return (
    <div className="flex flex-col w-full mt-10">
      <div className="flex m-auto">
        <HealthBox
          value={`${Math.floor(toZeroIfNAN(userData.weight))}`}
          units="kg"
          name="Weight"
        />
        <HealthBox
          value={`${Math.floor(toZeroIfNAN(userData.height))}`}
          units="cm"
          name="Height"
        />
      </div>
      <div className="flex m-auto">
        <HealthBox
          value={`${Math.floor(toZeroIfNAN(userData.temperature))}`}
          units="°C"
          name="Temperature"
        />
        <HealthBox
          value={`${Math.floor(toZeroIfNAN(userData.heart_rate))}`}
          units="bpm"
          name="Heart Rate"
        />
      </div>
      <div className="flex m-auto">
        <HealthBox
          value={`${Math.floor(toZeroIfNAN(userData.blood_oxygen))}`}
          units="%"
          name="Blood Oxygen"
        />
        <HealthBox
          value={`${Math.floor(
            toZeroIfNAN(userData.blood_pressure_diastolic)
          )}/${Math.floor(toZeroIfNAN(userData.blood_pressure_systolic))}`}
          units="mmHg"
          small
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
  small?: boolean;
}

const HealthBox: React.FC<HealthBoxProps> = ({
  value,
  units,
  name,
  small = false,
}) => {
  return (
    <div className="flex flex-col justify-between w-32 h-32 px-3 py-4 border border-darker_secondary">
      <div className="relative w-min">
        <p
          className={`${
            small ? "mt-3 text-2xl font-bold" : "text-5xl"
          } font-light`}
        >
          {value}
        </p>
        <div className="absolute top-0" style={{ left: `calc(100% + 2px)` }}>
          <p className={`${small ? "text-xs" : "text-base"} font-base`}>
            {units}
          </p>
        </div>
      </div>
      <p className="text-sm font-base">{name}</p>
    </div>
  );
};

const lastMeasuredDateOption: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
};

export default MainPage;
