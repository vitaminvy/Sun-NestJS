import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttachmentEntity } from '../attachments/entities/attachment.entity';
import { UserEntity } from './entities/user.entity';

interface CreateUserData {
  email: string;
  username: string;
  password: string;
  bio: string | null;
  image: string | null;
}

interface CreateAvatarAttachmentData {
  attachableId: string;
  attachableType: string;
  fieldName: string;
}

@Injectable()
export class UsersDataAccess {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,

    @InjectRepository(AttachmentEntity)
    private readonly attachmentsRepository: Repository<AttachmentEntity>,
  ) {}

  createUser(userData: CreateUserData): UserEntity {
    return this.usersRepository.create(userData);
  }

  saveUser(user: UserEntity): Promise<UserEntity> {
    return this.usersRepository.save(user);
  }

  findUserById(userId: number): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { id: userId },
    });
  }

  findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  findUserByUsername(username: string): Promise<UserEntity | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  findAvatarAttachment(
    attachableId: string,
    attachableType: string,
    fieldName: string,
  ): Promise<AttachmentEntity | null> {
    return this.attachmentsRepository.findOne({
      where: {
        attachableId,
        attachableType,
        fieldName,
      },
    });
  }

  createAvatarAttachment(
    attachmentData: CreateAvatarAttachmentData,
  ): AttachmentEntity {
    return this.attachmentsRepository.create(attachmentData);
  }

  saveAvatarAttachment(
    attachment: AttachmentEntity,
  ): Promise<AttachmentEntity> {
    return this.attachmentsRepository.save(attachment);
  }
}
