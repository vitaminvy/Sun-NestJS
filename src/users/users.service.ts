import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { rename, unlink } from 'node:fs/promises';
import { basename, isAbsolute, join, relative } from 'node:path';
import { I18nService } from 'nestjs-i18n';
import type ms from 'ms';

import { AttachmentEntity } from '../attachments/entities/attachment.entity';
import { AccessCredentialRepository } from '../auth/access-credential.repository';
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
import { UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';
import { UsersDataAccess } from './users-data-access';

const DEFAULT_JWT_EXPIRES_IN = '1d';
const JWT_EXPIRES_IN_CONFIG_KEY = 'JWT_EXPIRES_IN';

interface ConfigReader {
  get<T>(propertyPath: string, defaultValue: T): T;
}

interface JwtSigner {
  sign(
    payload: {
      email: string;
      sub: number;
      username: string;
    },
    options: { expiresIn: ms.StringValue },
  ): string;
}

interface StoredCredentialRepository {
  saveDisabledCredential(credential: string, ttlSeconds: number): Promise<void>;
}

interface StoredAvatarFile {
  path: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface TranslationService {
  t(key: string): string;
}

interface UserStore {
  createAvatarAttachment(attachmentData: {
    attachableId: string;
    attachableType: string;
    fieldName: string;
  }): AttachmentEntity;
  createUser(userData: {
    bio: string | null;
    email: string;
    image: string | null;
    password: string;
    username: string;
  }): UserEntity;
  findAvatarAttachment(
    attachableId: string,
    attachableType: string,
    fieldName: string,
  ): Promise<AttachmentEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserById(userId: number): Promise<UserEntity | null>;
  findUserByUsername(username: string): Promise<UserEntity | null>;
  saveAvatarAttachment(attachment: AttachmentEntity): Promise<AttachmentEntity>;
  saveUser(user: UserEntity): Promise<UserEntity>;
}

@Injectable()
export class UsersService {
  private readonly passwordSaltRounds = 10;
  private readonly avatarFieldName = 'avatar';
  private readonly userAttachableType = 'User';
  private readonly disabledCredentialTtlSeconds = 3600;

  constructor(
    @Inject(UsersDataAccess)
    private readonly usersRepository: UserStore,

    @Inject(JwtService)
    private readonly jwtService: JwtSigner,

    @Inject(AccessCredentialRepository)
    private readonly accessCredentialRepository: StoredCredentialRepository,

    @Inject(ConfigService)
    private readonly configService: ConfigReader,

    @Inject(I18nService)
    private readonly i18nService: TranslationService,
  ) {}

  async register(registerUserDto: RegisterUserDto): Promise<UserResponseDto> {
    const email = registerUserDto.email.trim().toLowerCase();
    const username = registerUserDto.username.trim();

    await this.validateUniqueUser(email, username);

    const hashedPassword = await bcrypt.hash(
      registerUserDto.password,
      this.passwordSaltRounds,
    );

    const user = this.usersRepository.createUser({
      email,
      username,
      password: hashedPassword,
      bio: null,
      image: null,
    });

    const savedUser = await this.usersRepository.saveUser(user);

    return this.buildUserResponse(savedUser);
  }

  async login(loginUserDto: LoginUserDto): Promise<UserResponseDto> {
    const email = loginUserDto.email.trim().toLowerCase();

    const user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.INVALID_EMAIL_OR_PASSWORD',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginUserDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.INVALID_EMAIL_OR_PASSWORD',
      );
    }

    return this.buildUserResponse(user);
  }

  async getCurrentUser(
    userId: number,
    token: string,
  ): Promise<UserResponseDto> {
    const user = await this.findAuthenticatedUser(userId);

    return this.buildUserResponse(user, token);
  }

  async updateCurrentUser(
    userId: number,
    updateUserBody: UpdateUserRequestDto,
    avatarFile?: LocalUploadedFile,
  ): Promise<UserResponseDto> {
    let storedAvatar: StoredAvatarFile | undefined;

    try {
      const updateUserDto = this.normalizeUpdateUserDto(updateUserBody);
      const user = await this.findAuthenticatedUser(userId);

      await this.applyUserUpdates(user, updateUserDto);

      if (avatarFile) {
        storedAvatar = await this.moveAvatarToPublicPath(avatarFile);
      }

      let previousAvatarPath: string | undefined;

      if (storedAvatar) {
        previousAvatarPath = await this.upsertAvatarAttachment(
          user,
          storedAvatar,
        );
        user.image = storedAvatar.url;
      }

      const savedUser = await this.usersRepository.saveUser(user);

      await this.safelyDeleteLocalFile(previousAvatarPath);

      return this.buildUserResponse(savedUser);
    } catch (error) {
      await this.safelyDeleteLocalFile(storedAvatar?.path ?? avatarFile?.path);

      this.logUpdateCurrentUserFailure(error, userId);
      this.throwUpdateCurrentUserError(error);
    }
  }

  async storeRevokedAccessCredential(
    credential: string,
  ): Promise<{ message: string }> {
    await this.accessCredentialRepository.saveDisabledCredential(
      credential,
      this.disabledCredentialTtlSeconds,
    );

    return {
      message: this.i18nService.t(
        'translation.USERS.MESSAGES.ACCESS_CREDENTIAL_CLEARED',
      ),
    };
  }

  private async validateUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    const existingEmail = await this.usersRepository.findUserByEmail(email);

    if (existingEmail) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.EMAIL_TAKEN',
      );
    }

    const existingUsername =
      await this.usersRepository.findUserByUsername(username);

    if (existingUsername) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.USERNAME_TAKEN',
      );
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
    const existingEmail = await this.usersRepository.findUserByEmail(email);

    if (existingEmail && existingEmail.id !== currentUserId) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.EMAIL_TAKEN',
      );
    }
  }

  private async validateUniqueUsername(
    username: string,
    currentUserId: number,
  ): Promise<void> {
    const existingUsername =
      await this.usersRepository.findUserByUsername(username);

    if (existingUsername && existingUsername.id !== currentUserId) {
      throw this.createBodyErrorException(
        'translation.USERS.ERRORS.USERNAME_TAKEN',
      );
    }
  }

  private async findAuthenticatedUser(userId: number): Promise<UserEntity> {
    const user = await this.usersRepository.findUserById(userId);

    if (!user) {
      throw new UnauthorizedException(
        this.i18nService.t('translation.AUTH.ERRORS.UNAUTHORIZED'),
      );
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
          body: [
            this.i18nService.t('translation.USERS.ERRORS.INVALID_AVATAR_TYPE'),
          ],
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
    user: UserEntity,
    storedAvatar: StoredAvatarFile,
  ): Promise<string | undefined> {
    const attachableId = String(user.id);
    const existingAttachment = await this.usersRepository.findAvatarAttachment(
      attachableId,
      this.userAttachableType,
      this.avatarFieldName,
    );
    const previousAvatarPath = this.resolvePublicFilePath(
      existingAttachment?.url ?? user.image,
    );
    const attachment =
      existingAttachment ??
      this.usersRepository.createAvatarAttachment({
        attachableId,
        attachableType: this.userAttachableType,
        fieldName: this.avatarFieldName,
      });

    attachment.url = storedAvatar.url;
    attachment.fileName = storedAvatar.fileName;
    attachment.fileType = storedAvatar.fileType;
    attachment.fileSize = storedAvatar.fileSize;

    await this.usersRepository.saveAvatarAttachment(attachment);

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

  private logUpdateCurrentUserFailure(error: unknown, userId: number): void {
    Logger.warn(
      {
        message:
          'Failed to update current user; temporary uploaded files were cleaned up when present.',
        guidance:
          'Check request validation, file storage, and database availability before retrying.',
        userId,
        cause: error instanceof Error ? error.message : String(error),
      },
      UsersService.name,
    );
  }

  private throwUpdateCurrentUserError(error: unknown): never {
    if (error instanceof HttpException) {
      throw new HttpException(error.getResponse(), error.getStatus(), {
        cause: error,
      });
    }

    throw new InternalServerErrorException(
      this.i18nService.t('translation.USERS.ERRORS.UPDATE_FAILED'),
      {
        cause: error,
      },
    );
  }

  private getJwtExpiresIn(): ms.StringValue {
    return this.configService.get<ms.StringValue>(
      JWT_EXPIRES_IN_CONFIG_KEY,
      DEFAULT_JWT_EXPIRES_IN,
    );
  }

  private createBodyErrorException(
    translationKey: string,
  ): UnprocessableEntityException {
    return new UnprocessableEntityException({
      errors: {
        body: [this.i18nService.t(translationKey)],
      },
    });
  }

  private buildUserResponse(user: UserEntity, token?: string): UserResponseDto {
    const userToken =
      token ??
      this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          username: user.username,
        },
        {
          expiresIn: this.getJwtExpiresIn(),
        },
      );

    return new UserResponseDto(user, userToken);
  }
}
