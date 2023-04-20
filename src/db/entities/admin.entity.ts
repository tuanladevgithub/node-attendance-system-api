import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseCreateUpdateColumnEntity } from './baseCreateUpdateColumn.entity';

@Entity('t_admin')
export class AdminEntity extends BaseCreateUpdateColumnEntity {
  @PrimaryGeneratedColumn('increment', { type: 'int' })
  id: number;

  @Column({ type: 'varchar', name: 'username', unique: true })
  username: string;

  @Column({ type: 'varchar', name: 'password' })
  password: string;

  @Column({ type: 'varchar', name: 'name' })
  name: string;
}
