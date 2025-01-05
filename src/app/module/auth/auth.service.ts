import { PrismaClient } from "@prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import { IUser } from "../user/user.interface";
import bcrypt from "bcrypt";
import config from "../../../config";
import { createToken } from "../../utils/tokenGenerateFunction";

const prisma = new PrismaClient();

const registerUserIntoDB = async (payload: IUser) => {
  const { password } = payload;
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds)
  );
  payload.password = hashedPassword;
  const user = await prisma.user.findUnique({
    where: {
      email: payload?.email,
    },
  });
  if (user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is already exist!");
  }

  const result = await prisma.user.create({
    data: payload,
  });
  return result;
};

const loginUserIntoDB = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(400, "Invalid credentials");
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    throw new AppError(400, "Invalid credentials");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
  };

  const token = createToken(
    jwtPayload,
    config.jwt_secret as string,
    config.jwt_expires as string
  );
  return token;
};

const changePassword = async (
  userData: any,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await prisma.user.findFirst({
    where: {
      email: userData?.email,
    },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // checking if the user is blocked

  const userStatus = user?.isDeleted;

  if (userStatus === false) {
    throw new AppError(httpStatus.FORBIDDEN, "This user is blocked!");
  }

  if (!(await bcrypt.compare(payload?.oldPassword, user?.password as string))) {
    console.log(
      await bcrypt.compare(payload?.oldPassword, user?.password as string)
    );
    throw new AppError(httpStatus.FORBIDDEN, "Password do not matched");
  }

  const newHashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await prisma.user.update({
    where: {
      email: user?.email,
    },
    data: {
      password: newHashedPassword,
    },
  });
  return null;
};

export const authServices = {
  registerUserIntoDB,
  loginUserIntoDB,
  changePassword,
};
