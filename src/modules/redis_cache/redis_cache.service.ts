import { Injectable } from '@nestjs/common';
import { RedisClientType, createClient } from 'redis';

@Injectable()
export class RedisCacheService {
  private readonly redisClient: RedisClientType;

  constructor() {
    this.redisClient = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      database: 0,
    });

    this.redisClient.connect();
  }

  setResetPasswordCode(
    forUser: 'TEACHER' | 'STUDENT',
    userId: number,
    token: string,
  ) {
    return this.redisClient.set(
      `RESET_PASSWORD_CODE_${forUser}:${userId}`,
      token,
      {
        EX: 3 * 60,
      },
    );
  }

  test() {
    this.redisClient.setEx('abc2', 10, 'dskafjlads');
  }
}
