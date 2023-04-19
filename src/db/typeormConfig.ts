import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: '127.0.0.1',
  port: 7777,
  username: 'root',
  password: 'rootpw',
  database: 'node_attendance_system_db',
  entities: ['dist/db/entities/**/*.entity.{js,ts}'],
  migrations: ['dist/db/migrations/**/*.{js,ts}'],
  synchronize: false,
  migrationsTableName: 'system_migrations',
  charset: 'utf8mb4_general_ci',
  timezone: 'Z',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
