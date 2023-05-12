import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login-teacher')
  loginTeacher(@Body() loginDto: LoginDto) {
    return this.authService.loginTeacher(loginDto.email, loginDto.pass);
  }
}