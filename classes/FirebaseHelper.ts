import { db } from "@/app/firebase";
import { collection, getDocs, query } from "firebase/firestore";
import { UserData } from "./UserData";

abstract class FirebaseHelper {
  static async getAllUserData() {
    const userDataList: UserData[] = [];
    const q = query(collection(db, "users"));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      userDataList.push(doc.data() as UserData);
    });

    return userDataList;
  }
}

export default FirebaseHelper;
