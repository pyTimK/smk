import CheckIcon from "@/components/svg/CheckIcon";
import DemoPoseWeighing from "@/components/svg/DemoPoseWeighing";
import ProgressMeasuring from "@/components/svg/ProgressMeasuring";
import { interFont } from "@/styles/fonts";
import { Fragment, useContext, useEffect, useState } from "react";
import { RingLoader } from "react-spinners";
import { HealthGrid, MainPageContext } from "../main";
import DemoPoseHeight from "@/components/svg/DemoPoseHeight";
import DemoPoseVitals from "@/components/svg/DemoPoseVitals";
import DemoPoseBP from "@/components/svg/DemoPoseBP";
import VitalsLine from "@/components/svg/VitalsLine";
import WheelPicker, { PickerData } from "react-simple-wheel-picker";
import MyButton from "@/components/MyButton";
import {
  Timestamp,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { DeviceData } from "@/classes/DeviceData";
import { UserData } from "@/classes/UserData";
import notify from "@/myfunctions/notify";
import { DevicePageContext } from "../device";
import { FirestoreDataType } from "@/hooks/useFirestoreData";
import { Constants } from "../constants";

// create data; make it dynamic and up to x amount of numbers
const diastolicData: PickerData[] = [];
const diastolicDataMin = 40;
const diastolicDataMax = 200;
for (let i = diastolicDataMin; i <= diastolicDataMax; i++) {
  diastolicData.push({ id: i.toString(), value: i.toString() });
}

const systolicData: PickerData[] = [];
const systolicDataMin = 0;
const systolicDataMax = 120;
for (let i = systolicDataMin; i <= systolicDataMax; i++) {
  systolicData.push({ id: i.toString(), value: i.toString() });
}

const fetchFromFlask = async (url_path: string) => {
  try {
    const url = `http://127.0.0.1:5000/${url_path}`;
    const res = await fetch(url);
    const data = (await res.json()) as string;
    console.log(`FETCHED ${url_path}: ${data}`);
    return data;
  } catch (_e) {
    console.log("ERROR FETCHING");
    console.log(_e);
    return "";
  }
};

interface MeasuringPageProps {
  isDevice: boolean;
}

const MeasuringPage: React.FC<MeasuringPageProps> = ({ isDevice }) => {
  const { userData: userDataFromUser } = useContext(MainPageContext);
  const { deviceData, userData: userDataFromDevice } =
    useContext(DevicePageContext);

  console.log("WAWY");

  // useEffect(() => {
  //   if (isDevice) {
  //     fetch("http://127.0.0.1:5000/temp")
  //       .then((res) => res.json())
  //       .then((data) => {
  //         console.log(data);
  //       })
  //       .catch((err) => {
  //         console.log(err.message);
  //       });
  //   }
  // }, []);

  const userData = isDevice ? userDataFromDevice : userDataFromUser;

  useEffect(() => {
    console.log("WAWYeffect");
    if (isDevice) {
      switch (userDataFromDevice.measuring_stage) {
        case 0:
          fetchFromFlask("start_weighing").then((data) => {
            if (data === "START") {
              userDataFromDevice.updateData({
                measuring_stage: increment(1),
                record_date: serverTimestamp(),
              });
            }
          });
          break;

        case 1:
          fetchFromFlask("weight").then((data) => {
            const weight = parseFloat(data);
            userDataFromDevice.updateData({
              measuring_stage: increment(1),
              weight,
            });
          });
          break;

        case 2:
          setTimeout(() => {
            userDataFromDevice.updateData({
              measuring_stage: increment(1),
            });
          }, 3000);
          break;

        case 3:
          fetchFromFlask("start_height").then((data) => {
            if (data === "START") {
              userDataFromDevice.updateData({
                measuring_stage: increment(1),
              });
            }
          });
          break;

        case 4:
          fetchFromFlask("height").then((data) => {
            const height = parseFloat(data);
            userDataFromDevice.updateData({
              measuring_stage: increment(1),
              height,
            });
          });
          break;

        case 5:
          setTimeout(() => {
            userDataFromDevice.updateData({
              measuring_stage: increment(1),
            });
          }, 3000);
          break;

        case 6:
          fetchFromFlask("start_vitals").then((data) => {
            if (data === "START") {
              userDataFromDevice.updateData({
                measuring_stage: increment(1),
              });
            }
          });
          break;

        case 7:
          fetchFromFlask("vitals").then((data) => {
            // parse the string "temperature,blood_oxygen,heart_rate"
            const [temperature, heart_rate, blood_oxygen] = data
              .split(",")
              .map((d) => parseFloat(d));

            userDataFromDevice.updateData({
              measuring_stage: increment(1),
              temperature,
              heart_rate,
              blood_oxygen,
            });
          });
          break;

        case 8:
          setTimeout(() => {
            userDataFromDevice.updateData({
              measuring_stage: increment(1),
            });
          }, 3000);
          break;

        case 9:
          break;
      }
    }
  }, [userDataFromDevice.measuring_stage]);

  const handleOnReturn = () => {
    setDoc(doc(db, "devices", Constants.qrCode), {
      is_measuring: false,
      user_id: "",
    } as DeviceData);

    userData.updateData({
      measuring_stage: 0,
      is_measuring: false,
    });
  };

  switch (userData.measuring_stage) {
    case 0:
      return (
        <WeighingDesign>
          <p className="text-2xl text-center">
            Please stand on the weighing scale
          </p>
        </WeighingDesign>
      );

    case 1:
      return (
        <WeighingDesign isMeasuring>
          <p className="text-2xl text-center">Measuring...</p>
        </WeighingDesign>
      );

    case 2:
      return (
        <WeighingDesign isDone>
          <DataWithUnit data={userData.weight} unit="kg" />
        </WeighingDesign>
      );

    case 3:
      return (
        <HeightDesign>
          <p className="text-2xl text-center">
            Place the ruler on top of your head and press the button
          </p>
        </HeightDesign>
      );

    case 4:
      return (
        <HeightDesign isMeasuring>
          <p className="text-2xl text-center">Measuring...</p>
        </HeightDesign>
      );

    case 5:
      return (
        <HeightDesign isDone>
          <DataWithUnit data={userData.height} unit="cm" />
        </HeightDesign>
      );

    case 6:
      return (
        <VitalsDesign>
          <p className="text-2xl text-center">
            Place your hand at the vitals pad
          </p>
        </VitalsDesign>
      );

    case 7:
      return (
        <VitalsDesign isMeasuring>
          <p className="text-2xl text-center">Measuring</p>
        </VitalsDesign>
      );

    case 8:
      return (
        <VitalsDesign isDone>
          <div className="relative">
            <VitalsLine />
            <div className="absolute top-10 right-52">
              <DataWithUnit
                data={userData.temperature}
                unit="°C"
                titleSize="text-4xl"
              />
            </div>
            <div className="absolute top-10 left-40">
              <DataWithUnit
                data={userData.blood_oxygen}
                unit="%"
                titleSize="text-4xl"
              />
            </div>
            <div className="absolute top-30 left-20">
              <DataWithUnit
                data={userData.heart_rate}
                unit="bpm"
                titleSize="text-4xl"
              />
            </div>
          </div>
        </VitalsDesign>
      );

    case 9:
      return <BPDesignImplement />;

    case 10:
      return (
        <div className="flex flex-col space-y-10 mt-10">
          <p className="text-2xl text-center">Complete</p>
          <HealthGrid />
          <div className="w-full flex mt-8">
            <MyButton
              label="RETURN"
              color="bg-white"
              textColor="text-darker_primary"
              pX={1}
              pY={0.6}
              notRounded
              onClick={handleOnReturn}
            />
          </div>
        </div>
      );

    default:
      return <></>;
  }
};

const BPDesignImplement: React.FC = () => {
  const [diastolic, setDiastolic] = useState(110);
  const [systolic, setSystolic] = useState(70);

  const handleOnBPSubmit = async () => {
    const deviceDocSnapshot = await getDoc(
      doc(db, "devices", "smartmedicalkiosk_device1")
    );
    const deviceDoc = deviceDocSnapshot.data() as DeviceData;
    if (!deviceDoc.user_id) {
      console.log("No user_id");
      notify("No user_id");
      return;
    }

    updateDoc(doc(db, "users", deviceDoc.user_id), {
      blood_pressure_diastolic: diastolic,
      blood_pressure_systolic: systolic,
      measuring_stage: increment(1),
    } as Partial<UserData> & { measuring_stage: any });
  };
  return (
    <BPDesign>
      <p className="text-2xl text-center">Measure your blood pressure</p>
      <div className="flex justify-center items-center space-x-8 mt-10">
        <div className="flex flex-col">
          <WheelPicker
            data={diastolicData}
            idName="wheelpicker"
            onChange={(data) => {
              setDiastolic(parseInt(data.id));
            }}
            height={100}
            width={60}
            itemHeight={30}
            selectedID="110"
            color="#000"
            shadowColor="transparent"
            activeColor="red"
            backgroundColor="transparent"
          />
          <p className={`${interFont} mt-3`}>Diastolic</p>
        </div>
        <p className="text-7xl font-light">/</p>
        <div className="flex flex-col">
          <WheelPicker
            data={systolicData}
            idName="wheelpicker2"
            onChange={(data) => {
              setSystolic(parseInt(data.id));
            }}
            height={100}
            width={60}
            itemHeight={30}
            selectedID="70"
            color="#000"
            shadowColor="transparent"
            activeColor="red"
            backgroundColor="transparent"
          />
          <p className={`${interFont} mt-3`}>Systolic</p>
        </div>
      </div>
      <div className="w-full flex mt-8">
        <MyButton
          label="SUBMIT"
          color="bg-white"
          textColor="text-darker_primary"
          pX={1}
          pY={0.6}
          notRounded
          onClick={handleOnBPSubmit}
        />
      </div>
    </BPDesign>
  );
};

interface DataWithUnitProps {
  data: number;
  unit: string;
  titleSize?: string;
}

const DataWithUnit: React.FC<DataWithUnitProps> = ({
  data,
  unit,
  titleSize = "text-7xl",
}) => {
  return (
    <div className="relative w-min m-auto">
      <p className={`${titleSize} font-light text-center`}>{data}</p>
      <div className="absolute top-0" style={{ left: `calc(100% + 2px)` }}>
        <p className="text-xl font-base">{unit}</p>
      </div>
    </div>
  );
};

//! WEIGHING
interface WeighingDesignProps {
  children: React.ReactNode;
  isMeasuring?: boolean;
  isDone?: boolean;
}

const WeighingDesign: React.FC<WeighingDesignProps> = ({
  isMeasuring = false,
  isDone = false,
  children,
}) => {
  return (
    <BaseDesign
      title="Weighing"
      poseSvg={<DemoPoseWeighing />}
      isMeasuring={isMeasuring}
      isDone={isDone}
      level={1}
    >
      {children}
    </BaseDesign>
  );
};

//! HEIGHT
interface HeightDesignProps {
  children: React.ReactNode;
  isMeasuring?: boolean;
  isDone?: boolean;
}

const HeightDesign: React.FC<HeightDesignProps> = ({
  isMeasuring = false,
  isDone = false,
  children,
}) => {
  return (
    <BaseDesign
      title="Height"
      poseSvg={<DemoPoseHeight />}
      isMeasuring={isMeasuring}
      isDone={isDone}
      level={2}
    >
      {children}
    </BaseDesign>
  );
};

//! VITALS
interface VitalsDesignProps {
  children: React.ReactNode;
  isMeasuring?: boolean;
  isDone?: boolean;
}

const VitalsDesign: React.FC<VitalsDesignProps> = ({
  isMeasuring = false,
  isDone = false,
  children,
}) => {
  return (
    <BaseDesign
      title="Temperature,\nHeart Rate,\nBlood Oxygen"
      titleSize="text-3xl"
      poseSvg={<DemoPoseVitals />}
      isMeasuring={isMeasuring}
      isDone={isDone}
      level={3}
    >
      {children}
    </BaseDesign>
  );
};

//! BLOOD PRESSURE
interface BPDesignProps {
  children: React.ReactNode;
  isMeasuring?: boolean;
  isDone?: boolean;
}

const BPDesign: React.FC<BPDesignProps> = ({
  isMeasuring = false,
  isDone = false,
  children,
}) => {
  return (
    <BaseDesign
      title="Blood\nPressure"
      poseSvg={<DemoPoseBP />}
      isMeasuring={isMeasuring}
      isDone={isDone}
      level={4}
    >
      {children}
    </BaseDesign>
  );
};

interface BaseDesign {
  children: React.ReactNode;
  title: string;
  titleSize?: string;
  poseSvg: React.ReactNode;
  isMeasuring: boolean;
  isDone: boolean;
  level: number;
}

const BaseDesign: React.FC<BaseDesign> = ({
  title,
  titleSize = "text-5xl",
  poseSvg,
  isMeasuring,
  isDone,
  children,
  level,
}) => {
  return (
    <div
      className={`${interFont} w-full min-h-screen bg-darker_primary text-white flex flex-col pt-16  items-center`}
    >
      <BreakByLines message={title} titleSize={titleSize} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center space-y-8">
        <div className="h-64 flex items-end">{poseSvg}</div>
        <div className="w-72 h-64">{children}</div>
      </div>
      {isMeasuring && (
        <div className="absolute bottom-24">
          <RingLoader color="white" />
        </div>
      )}
      {isDone && (
        <div className="absolute bottom-24">
          <CheckIcon />
        </div>
      )}
      <div className="absolute bottom-10">
        <ProgressMeasuring level={level} />
      </div>
    </div>
  );
};

const BreakByLines = ({
  message,
  titleSize,
}: {
  message: string;
  titleSize: string;
}) => {
  // console.log(message);
  // console.log(message.split("\\n"));
  const lines = message.split("\\n").map((line, index) => (
    <Fragment key={index}>
      {line}
      {index < message.split("\\n").length - 1 && <br />}
    </Fragment>
  ));

  return (
    <p className={`${titleSize} whitespace-pre-line text-center font-bold`}>
      {lines}
    </p>
  );
};
export default MeasuringPage;
