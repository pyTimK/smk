export interface UserData {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  sex: string;
  birth_date: Date;
  weight: number;
  height: number;
  temperature: number;
  heart_rate: number;
  blood_oxygen: number;
  blood_pressure: number;
  record_date: Date;
}

export const constructEmptyUserData = (): UserData => {
  return {
    uid: "",
    email: "",
    first_name: "",
    last_name: "",
    sex: "",
    birth_date: new Date(),
    weight: 0,
    height: 0,
    temperature: 0,
    heart_rate: 0,
    blood_oxygen: 0,
    blood_pressure: 0,
    record_date: new Date(),
  } as UserData;
};
