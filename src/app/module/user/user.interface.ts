export interface IUser {
  name: string;
  email: string;
  password: string;
  avatar: string;
  status: "online" | "offline" | "away";
  isDeleted: boolean;
}
