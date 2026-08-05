import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { rename, unlink } from 'node:fs/promises';
import { basename, isAbsolute, join, relative } from 'node:path';
import { Repository } from 'typeorm';

import { AttachmentEntity } from '../attachments/entities/attachment.entity';
import { RedisService } from '../redis/redis.service';
import type { LocalUploadedFile } from '../uploads/interfaces/local-uploaded-file.interface';
import {
  AVATAR_MIME_TYPE_EXTENSIONS,
  PUBLIC_ROOT,
  PUBLIC_URL_PREFIX,
  USER_AVATAR_PUBLIC_URL_PREFIX,
} from '../uploads/upload.constants';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto, UpdateUserRequestDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserResponse } from './interfaces/user-response.interface';

interface StoredAvatarFile {
  path: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = 10;
  private readonly avatarFieldName = 'avatar';
  private readonly userAttachableType = 'User';

  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,

    private readonly redisService: RedisService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<UserResponse> {
    const email = registerUserDto.email.trim().toLowerCase();
    const username = registerUserDto.username.trim();

    await this.validateUniqueUser(email, username);

    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      this.passwordSaltRounds,
    );

    const user = this.usersRepository.create({
      email,
      username,
      password: hashedPassword,
      bio: null,
      image: null,
    });

    const savedUser = await this.usersRepository.save(user);

    return this.buildUserResponse(savedUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponse> {
    const email = loginUserDto.email.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email or password is invalid'],
        },
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email or password is invalid'],
        },
      });
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(userId: number, token: string): Promise<UserResponse> {
    const user = await this.findAuthenticatedUser(userId);

    return this.buildUserResponse(user, token);
  }

  async updateCurrentUser(
    userId: number,
    updateUserBody: UpdateUserRequestDto,
    avatarFile?: LocalUploadedFile,
  ): Promise<UserResponse> {
    let storedAvatar: StoredAvatarFile | undefined;

    try {
      const updateUserDto = this.normalizeUpdateUserDto(updateUserBody);
      const user = await this.findAuthenticatedUser(userId);

      await this.applyUserUpdates(user, updateUserDto);

      if (avatarFile) {
        storedAvatar = await this.moveAvatarToPublicPath(avatarFile);
      }

      const { savedUser, previousAvatarPath } =
        await this.usersRepository.manager.transaction<{
          savedUser: UserEntity;
          previousAvatarPath?: string;
        }>(async (manager) => {
          let previousAvatarPath: string | undefined;

          if (storedAvatar) {
            const attachmentsRepository =
              manager.getRepository(AttachmentEntity);

            previousAvatarPath = await this.upsertAvatarAttachment(
              attachmentsRepository,
              user,
              storedAvatar,
            );
            user.image = storedAvatar.url;
          }

          const userRepository = manager.getRepository(UserEntity);
          const savedUser = await userRepository.save(user);

          return {
            savedUser,
            previousAvatarPath,
          };
        });

      await this.safelyDeleteLocalFile(previousAvatarPath);

      return this.buildUserResponse(savedUser);
    } catch (error) {
      await this.safelyDeleteLocalFile(storedAvatar?.path ?? avatarFile?.path);

      throw error;
    }
  }

  async logout(token: string): Promise<{ message: string }> {
    const client = this.redisService.getClient();

    await client.set(token, 'blacklisted', 'EX', 3600);

    return {
      message: 'Logout successfully',
    };
  }

  private async validateUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    const existingEmail = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingEmail) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email has already been taken'],
        },
      });
    }

    const existingUsername = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUsername) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['username has already been taken'],
        },
      });
    }
  }

  private normalizeUpdateUserDto(
    updateUserBody?: UpdateUserRequestDto,
  ): UpdateUserDto {
    if (updateUserBody?.user) {
      return updateUserBody.user;
    }

    return {
      bio: updateUserBody?.bio,
      email: updateUserBody?.email,
      password: updateUserBody?.password,
      username: updateUserBody?.username,
    };
  }

  private async applyUserUpdates(
    user: UserEntity,
    updateUserDto: UpdateUserDto,
  ): Promise<void> {
    if (updateUserDto.email !== undefined) {
      const email = updateUserDto.email.trim().toLowerCase();

      if (email !== user.email) {
        await this.validateUniqueEmail(email, user.id);
        user.email = email;
      }
    }

    if (updateUserDto.username !== undefined) {
      const username = updateUserDto.username.trim();

      if (username !== user.username) {
        await this.validateUniqueUsername(username, user.id);
        user.username = username;
      }
    }

    if (updateUserDto.password !== undefined) {
      user.password = await bcrypt.hash(
        updateUserDto.password,
        this.passwordSaltRounds,
      );
    }

    if (updateUserDto.bio !== undefined) {
      user.bio = updateUserDto.bio === null ? null : updateUserDto.bio;
    }
  }

  private async validateUniqueEmail(
    email: string,
    currentUserId: number,
  ): Promise<void> {
    const existingEmail = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingEmail && existingEmail.id !== currentUserId) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['email has already been taken'],
        },
      });
    }
  }

  private async validateUniqueUsername(
    username: string,
    currentUserId: number,
  ): Promise<void> {
    const existingUsername = await this.usersRepository.findOne({
      where: { username },
    });

    if (existingUsername && existingUsername.id !== currentUserId) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['username has already been taken'],
        },
      });
    }
  }

  private async findAuthenticatedUser(userId: number): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Unauthorized');
    }

    return user;
  }

  private async moveAvatarToPublicPath(
    avatarFile: LocalUploadedFile,
  ): Promise<StoredAvatarFile> {
    const extension = AVATAR_MIME_TYPE_EXTENSIONS[avatarFile.mimetype];

    if (!extension) {
      throw new UnprocessableEntityException({
        errors: {
          body: ['avatar must be a gif, jpeg, png or webp'],
        },
      });
    }

    const fileName = `${avatarFile.filename}${extension}`;
    const filePath = join(avatarFile.destination, fileName);

    await rename(avatarFile.path, filePath);

    return {
      path: filePath,
      url: `${USER_AVATAR_PUBLIC_URL_PREFIX}/${fileName}`,
      fileName: this.truncateFileName(basename(avatarFile.originalname)),
      fileType: avatarFile.mimetype,
      fileSize: avatarFile.size,
    };
  }

  private async upsertAvatarAttachment(
    attachmentsRepository: Repository<AttachmentEntity>,
    user: UserEntity,
    storedAvatar: StoredAvatarFile,
  ): Promise<string | undefined> {
    const attachableId = String(user.id);
    const existingAttachment = await attachmentsRepository.findOne({
      where: {
        attachableId,
        attachableType: this.userAttachableType,
        fieldName: this.avatarFieldName,
      },
    });
    const previousAvatarPath = this.resolvePublicFilePath(
      existingAttachment?.url ?? user.image,
    );
    const attachment =
      existingAttachment ??
      attachmentsRepository.create({
        attachableId,
        attachableType: this.userAttachableType,
        fieldName: this.avatarFieldName,
      });

    attachment.url = storedAvatar.url;
    attachment.fileName = storedAvatar.fileName;
    attachment.fileType = storedAvatar.fileType;
    attachment.fileSize = storedAvatar.fileSize;

    await attachmentsRepository.save(attachment);

    return previousAvatarPath === storedAvatar.path
      ? undefined
      : previousAvatarPath;
  }

  private resolvePublicFilePath(url?: string | null): string | undefined {
    if (!url?.startsWith(`${PUBLIC_URL_PREFIX}/`)) {
      return undefined;
    }

    const relativePublicPath = url.slice(PUBLIC_URL_PREFIX.length + 1);
    const filePath = join(PUBLIC_ROOT, relativePublicPath);
    const pathFromPublicRoot = relative(PUBLIC_ROOT, filePath);

    if (pathFromPublicRoot.startsWith('..') || isAbsolute(pathFromPublicRoot)) {
      return undefined;
    }

    return filePath;
  }

  private async safelyDeleteLocalFile(filePath?: string): Promise<void> {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch {
      return;
    }
  }

  private truncateFileName(fileName: string): string {
    return fileName.length > 255 ? fileName.slice(0, 255) : fileName;
  }

  private buildUserResponse(user: UserEntity, token?: string): UserResponse {
    const userToken =
      token ??
      this.jwtService.sign({
        sub: user.id,
        email: user.email,
        username: user.username,
      });

    return {
      user: {
        email: user.email,
        token: userToken,
        username: user.username,
        bio: user.bio,
        image: user.image,
      },
    };
  }
}
