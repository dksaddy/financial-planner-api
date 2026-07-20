import * as targetRepository from "../repositories/targets.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { TARGET_MESSAGES } from "../constants/messages.js";

export const createTarget = async (
  userId,
  body
) => {

  return await targetRepository.create({
    userId,
    ...body,
  });

};

export const getTargets = async (
  userId
) => {

  return await targetRepository.findAllByUser(
    userId
  );

};

export const getTarget = async (
  id,
  userId
) => {

  const target =
    await targetRepository.findById(
      id,
      userId
    );

  if (!target) {
    throw new AppError(
      TARGET_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return target;
};

export const updateTarget = async (
  id,
  userId,
  body
) => {

  const existing =
    await targetRepository.findById(
      id,
      userId
    );

  if (!existing) {
    throw new AppError(
      TARGET_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return await targetRepository.update(
    id,
    userId,
    {
      ...existing,
      ...body,
    }
  );

};

export const deleteTarget = async (
  id,
  userId
) => {

  const existing =
    await targetRepository.findById(
      id,
      userId
    );

  if (!existing) {
    throw new AppError(
      TARGET_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  await targetRepository.remove(
    id,
    userId
  );

};