import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login-student')
  loginStudent(@Body() loginDto: LoginDto) {
    return this.authService.loginStudent(loginDto.email, loginDto.pass);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login-teacher')
  loginTeacher(@Body() loginDto: LoginDto) {
    return this.authService.loginTeacher(loginDto.email, loginDto.pass);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login-admin')
  loginAdmin(@Body('username') username: string, @Body('pass') pass: string) {
    return this.authService.loginAdmin(username, pass);
  }

  @HttpCode(HttpStatus.OK)
  @Post('send-reset-code-teacher')
  sendResetCodeTeacher(@Body('email') email: string) {
    return this.authService.sendResetCodeTeacher(email);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset-password-teacher/:resetCode')
  resetPasswordTeacher(
    @Param('resetCode') resetCode: string,
    @Body('newPass') newPass: string,
  ) {
    return this.authService.resetPasswordTeacher(resetCode, newPass);
  }

  @HttpCode(HttpStatus.OK)
  @Post('send-reset-code-student')
  sendResetCodeStudent(@Body('email') email: string) {
    return this.authService.sendResetCodeStudent(email);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('reset-password-student/:resetCode')
  resetPasswordStudent(
    @Param('resetCode') resetCode: string,
    @Body('newPass') newPass: string,
  ) {
    return this.authService.resetPasswordStudent(resetCode, newPass);
  }
}
