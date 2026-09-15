import { User } from '../models/User';
import { IUserRepository } from '../repositories/user.repository';

export interface IUserService {
  getIdUsingUuid(userUuid: string): Promise<number>;
  getUserUsingUuid(userUuid: string): Promise<User>;
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
  async getIdUsingUuid(userUuid: string): Promise<number> {
    return this.userRepository.getIdUsingUuid(userUuid);
  }
  async getUserUsingUuid(userUuid: string): Promise<User> {
    return this.userRepository.findUserInfoByUuid(userUuid);
  }
}
