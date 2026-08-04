import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('attachments')
@Index(['attachableType', 'attachableId'])
export class AttachmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'attachable_type', length: 100 })
  attachableType!: string;

  @Column({ name: 'attachable_id', length: 100 })
  attachableId!: string;

  @Column({ name: 'field_name', type: 'varchar', length: 100, nullable: true })
  fieldName!: string | null;

  @Column({ length: 500 })
  url!: string;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'file_type', length: 100 })
  fileType!: string;

  @Column({ name: 'file_size', type: 'int', unsigned: true })
  fileSize!: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
