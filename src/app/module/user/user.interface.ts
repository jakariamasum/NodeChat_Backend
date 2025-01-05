interface User {
  username: string;
  email: string;
  password: string;
  avatar: string;
  status: "online" | "offline" | "away";
}
