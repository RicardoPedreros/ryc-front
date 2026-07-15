import type { IUserRepository } from '@/domain/auth/repositories/user-repository';
import type { IRoleRepository } from '@/domain/auth/repositories/role-repository';
import type { AuthenticatedUser } from '@/domain/auth/entities/user';

export class AuthenticateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute(
    username: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    if (!username.trim()) {
      throw new Error('Username is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }

    const authResult = await this.userRepository.authenticate(username, password);

    if (!authResult) {
      throw new Error('Invalid credentials');
    }

    if (!authResult.isActive) {
      throw new Error('Account is disabled');
    }

    const role = await this.roleRepository.findById(authResult.roleId);

    await this.userRepository.updateLastLogin(authResult.id);

    return {
      id: authResult.id,
      username: authResult.username,
      roleId: authResult.roleId,
      roleCode: role?.code ?? 'USER',
      firstName: null,
      lastName: null,
    };
  }
}
