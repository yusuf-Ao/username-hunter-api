import {
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { SupportedPlatforms } from './data';
import { ResponseDto } from './dtos/response.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get('health-check')
  getHello(): string {
    return 'Server Available!..';
  }

  @Get('/supported-platforms')
  async getSupportedPlatforms(@Res() res: Response) {
    const response = new ResponseDto();
    try {
      response.success = true;
      response.message = 'Request completed successfully';
      response.statusCode = 200;
      response.data = SupportedPlatforms;
      response.results = SupportedPlatforms.length;
      return res.status(200).json(response);
    } catch (error) {
      const msg = error.message;
      this.logger.error(msg, error);
      response.success = false;
      response.message = msg;
      response.statusCode = 417;
      return res.status(417).json(response);
    }
  }

  @Post('/hunt/:username')
  async findUsername(
    @Res() res: Response,
    @Param('username') username: string,
    @Query('platforms') platforms?: string,
  ) {
    const response = new ResponseDto();
    try {
      const selectedPlatforms: string[] = platforms
        ? platforms.split(',')
        : SupportedPlatforms;

      response.success = true;
      response.message = 'Request completed successfully';
      response.statusCode = 200;
      response.data = await this.appService.checkUsernameAvailability(
        username,
        selectedPlatforms,
      );
      response.results = response.data.length;
      return res.status(200).json(response);
    } catch (error) {
      const msg = error.message;
      this.logger.error(msg, error);
      response.success = false;
      response.message = msg;
      response.statusCode = 417;
      return res.status(417).json(response);
    }
  }
}
