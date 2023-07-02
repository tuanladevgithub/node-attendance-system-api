import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  entities: ['dist/db/entities/**/*.entity.{js,ts}'],
  migrations: ['dist/db/migrations/**/*.{js,ts}'],
  synchronize: false,
  migrationsTableName: 'system_migrations',
  charset: 'utf8mb4_general_ci',
  timezone: '+07:00',
  logging: ['query', 'error', 'warn'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
