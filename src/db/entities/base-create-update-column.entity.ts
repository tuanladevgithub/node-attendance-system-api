import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseCreateUpdateColumnEntity {
  @CreateDateColumn({ name: 'created_at' })
  created_at: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: string;
}
